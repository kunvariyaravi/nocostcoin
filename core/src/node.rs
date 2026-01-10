use crate::config::AppConfig;
use crate::network::{NetworkConfig, NetworkNode, SyncMessage};
use crate::crypto::Crypto;
use crate::wallet::Wallet;
use ed25519_dalek::{SigningKey, Signer};
use crate::block::{Block, BlockHeader};
use crate::chain::Chain;
use crate::mempool::Mempool;
use crate::sync::{SyncManager, SyncEvent};
use chrono::Utc;
use std::time::Duration;
use tokio::sync::mpsc;
use tokio::io::{AsyncBufReadExt, BufReader};
use crate::vote::Vote;
use tracing::{info, error, warn};

pub struct Node {
    config: AppConfig,
}

enum CliCommand {
    Info,
    Send { receiver: String, amount: u64 },
    ToggleSim,
    Help,
}

impl Node {
    pub fn new(config: AppConfig) -> Self {
        Self { config }
    }

    pub async fn run(self) {
        info!("Starting Nocostcoin Node on port {}...", self.config.network.port);

        let port = self.config.network.port;

        // Network configuration
        let network_config = NetworkConfig {
            listen_addr: self.config.network.listen_addr.clone(),
            bootstrap_peers: self.config.network.bootstrap_peers.clone(),
        };

        // Create channels for network communication
        let (block_tx, mut block_rx) = mpsc::unbounded_channel();
        let (tx_tx, mut tx_rx) = mpsc::unbounded_channel();
        let (sync_tx, mut sync_rx) = mpsc::unbounded_channel();
        let (sync_event_tx, mut sync_event_rx) = mpsc::unbounded_channel();

        let (cli_tx, mut cli_rx) = mpsc::unbounded_channel();
        let (vote_tx, mut vote_rx) = mpsc::unbounded_channel();
        let (api_tx, mut api_rx) = mpsc::unbounded_channel();
        
        // Calculate API port (HTTP API on port - 1000)
        // P2P: 9000-9002 -> API: 8000-8002
        let api_port = port - 1000;
        let api_config = crate::api::ApiConfig { port: api_port as u16 };
        
        tokio::spawn(async move {
            crate::api::start_api_server(api_config, api_tx).await;
        });

        // Initialize network node
        let (mut network_node, network_client) = NetworkNode::new(network_config, block_tx, tx_tx, vote_tx, sync_tx)
            .await
            .expect("Failed to create network node");

        // Helper to generate deterministic keypair from a seed string (Schnorrkel)
        fn generate_validator_keypair(seed_str: &str) -> schnorrkel::Keypair {
            let mut seed = [0u8; 32];
            let bytes = seed_str.as_bytes();
            for (i, &b) in bytes.iter().enumerate().take(32) {
                seed[i] = b;
            }
            let mini_secret = schnorrkel::MiniSecretKey::from_bytes(&seed)
                .expect("Failed to create secret from seed");
            let secret = mini_secret.expand(schnorrkel::ExpansionMode::Ed25519);
            secret.to_keypair()
        }

        // Helper to generate deterministic Ed25519 key (Wallet)
        fn generate_wallet_key(seed_str: &str) -> SigningKey {
            let mut seed = [0u8; 32];
            let bytes = seed_str.as_bytes();
            for (i, &b) in bytes.iter().enumerate().take(32) {
                seed[i] = b;
            }
            SigningKey::from_bytes(&seed)
        }

        // Determine base path
        let base_path = self.config.data_dir.clone().unwrap_or_else(|| std::path::PathBuf::from("."));

        // 1. Initialize Validator Key (Schnorrkel) for Consensus
        let val_filename = format!("validator_{}.key", port);
        let val_path = base_path.join(val_filename);
        
        let validator_keypair = if let Some(seed) = &self.config.mining.validator_seed {
            info!("Using deterministic validator key from config");
            generate_validator_keypair(seed)
        } else {
            // Load or create validator key file
            if val_path.exists() {
               let bytes = std::fs::read(&val_path).expect("Failed to read validator key");
               schnorrkel::SecretKey::from_bytes(&bytes).expect("Invalid key").to_keypair()
            } else {
               info!("Creating new validator key at {:?}", val_path);
               let kp = schnorrkel::Keypair::generate();
               std::fs::write(&val_path, kp.secret.to_bytes()).expect("Failed to save validator key");
               kp
            }
        };

        // 2. Initialize Wallet Key (Ed25519) for Transactions
        let wallet_filename = format!("wallet_{}.key", port);
        let wallet_path = base_path.join(wallet_filename);
        let wallet_path_str = wallet_path.to_str().unwrap();
        
        let wallet_keypair = if let Some(seed) = &self.config.mining.validator_seed {
            info!("Using deterministic wallet key from seed");
            let kp = generate_wallet_key(seed);
            
            // Save just for checks
            let w = Wallet::from_keypair(kp.clone());
             if let Err(e) = w.save_to_file(wallet_path_str) {
                warn!("Warning: Failed to save deterministic wallet: {}", e);
            }
            kp
        } else {
            match Wallet::load_from_file(wallet_path_str) {
                Ok(w) => {
                    info!("Loaded wallet from {}", wallet_path_str);
                    w.keypair
                }
                Err(_) => {
                    info!("Creating new wallet at {}", wallet_path_str);
                    let w = Wallet::new();
                    w.save_to_file(wallet_path_str).expect("Failed to save wallet");
                    w.keypair
                }
            }
        };

        // Create Deterministic Genesis Block
        use schnorrkel::{MiniSecretKey, SecretKey};
        let genesis_seed_str = &self.config.genesis.genesis_seed;
        let genesis_seed_str = &self.config.genesis.genesis_seed;
        let genesis_kp = generate_validator_keypair(genesis_seed_str);
        
        let genesis_vrf_output = vec![0u8; 32];
        let genesis_vrf_proof = vec![0u8; 64];
        
        let genesis_time = self.config.genesis.genesis_time;

        let genesis_header = BlockHeader {
            parent_hash: "0".to_string(),
            slot: 0,
            epoch: 0,
            vrf_output: genesis_vrf_output,
            vrf_proof: genesis_vrf_proof,
            validator_pubkey: genesis_kp.public.to_bytes().to_vec(),
            producer_signature: vec![],
            state_root: "".to_string(),
            tx_root: "".to_string(),
            extra_witnesses: vec![],
            timestamp: genesis_time,
        };
        
        let genesis_block = Block::new(genesis_header, vec![]);
        
        info!("Genesis block hash: {}", genesis_block.hash);

        // Initialize Storage with unique path per port
        let db_filename = format!("nocostcoin_db_{}", port);
        let db_path = base_path.join(db_filename);
        let storage = crate::storage::Storage::new(db_path.to_str().unwrap()).expect("Failed to create storage");

        // Initialize Chain with Storage
        let mut chain = Chain::new(storage, genesis_block.clone(), genesis_time);

        // PRE-REGISTER Configured Validators
        info!("Pre-registering initial validators...");
        for seed in &self.config.genesis.initial_validators {
            let node_kp = generate_validator_keypair(seed);
            let node_pubkey = node_kp.public.to_bytes().to_vec();
            
            if chain.state.get_balance(&node_pubkey) == 0 {
                chain.state.set_balance(node_pubkey.clone(), 1_000_000);
                let _ = chain.validators.register_validator(node_pubkey, 1_000_000, 0);
            }
        }
        
        // Register self if we have balance (or give balance if genesis logic allows)
        // For Devnet simplicity: ensure self has balance if we are using a configured seed
        // (The loop above likely covered us if we are in the initial list)
        // If we are NOT in the initial list, we might need funding (Faucet).
        let my_address = wallet_keypair.verifying_key().to_bytes().to_vec();
        if self.config.mining.validator_seed.is_some() {
             // If we rely on seed, we expect to be in genesis. 
             // Double check balance.
             if chain.state.get_balance(&my_address) == 0 {
                  // Fallback for standalone dev mode: fund self
                  info!("Funding self (standalone mode)...");
                  chain.state.set_balance(my_address.clone(), 1_000_000);
                  let _ = chain.validators.register_validator(my_address.clone(), 1_000_000, 0);
             }
        }
        
        // CRITICAL: Persist initial balances to disk
        if let Err(e) = chain.state.apply_changes() {
            error!("CRITICAL ERROR: Failed to persist initial balances: {}", e);
        } else {
            info!("✓ Successfully persisted initial balances to disk");
        }

        info!("Chain initialized with genesis: {}", genesis_block.hash);

        // Spawn network task
        let network_handle = tokio::spawn(async move {
            network_node.run().await;
        });

        // Give network time to connect
        tokio::time::sleep(Duration::from_secs(1)).await;

        // Spawn CLI input task
        let cli_tx_clone = cli_tx.clone();
        tokio::spawn(async move {
            let stdin = tokio::io::stdin();
            let mut reader = BufReader::new(stdin).lines();
            println!("Type 'help' for commands.");
            
            while let Ok(Some(line)) = reader.next_line().await {
                let parts: Vec<&str> = line.trim().split_whitespace().collect();
                if parts.is_empty() { continue; }
                
                match parts[0] {
                    "info" => { let _ = cli_tx_clone.send(CliCommand::Info); },
                    "help" => { let _ = cli_tx_clone.send(CliCommand::Help); },
                    "sim" => { let _ = cli_tx_clone.send(CliCommand::ToggleSim); },
                    "send" => {
                        if parts.len() == 3 {
                            let receiver_hex = parts[1];
                            if let Ok(amount) = parts[2].parse() {
                                let _ = cli_tx_clone.send(CliCommand::Send { receiver: receiver_hex.to_string(), amount });
                            } else {
                                println!("Invalid amount");
                            }
                        } else {
                            println!("Usage: send <receiver_hex> <amount>");
                        }
                    }
                    _ => println!("Unknown command. Type 'help'."),
                }
            }
        });

        // Spawn blockchain simulation task
        let blockchain_handle = tokio::spawn(async move {
            let mut validator_keypair = validator_keypair;
            let mut wallet_keypair = wallet_keypair;
            let mut my_address = wallet_keypair.verifying_key().to_bytes().to_vec();
            let mut last_slot = 0;
            let mut mempool = Mempool::new(1000);
            let mut sync_manager = SyncManager::new(sync_event_tx);
            let mut simulation_enabled = false;

            // Run indefinitely
            loop {
                while let Ok(vote) = vote_rx.try_recv() {
                    chain.add_vote(vote);
                }
                
                // Handle sync messages
                while let Ok(sync_msg) = sync_rx.try_recv() {
                    match sync_msg {
                        SyncMessage::ChainInfo { peer_id, height, .. } => {
                            println!("Peer {} has height {}", peer_id, height);
                            sync_manager.update_peer_info(peer_id, height);
                            
                            let our_height = chain.get_height();
                            if let Some((sync_peer, target_height)) = sync_manager.should_sync(our_height) {
                                println!("Starting sync with peer {} (height: {})", sync_peer, target_height);
                                sync_manager.start_sync(sync_peer, target_height);
                                
                                let head_hash = chain.head.clone();
                                network_client.request_blocks(sync_peer, head_hash, 100);
                            }
                        }
                        SyncMessage::Blocks { peer_id, blocks } => {
                            println!("Received {} blocks from {}", blocks.len(), peer_id);
                            if let Err(e) = sync_manager.process_blocks(blocks.clone(), &mut chain) {
                                eprintln!("Sync failed: {}", e);
                                sync_manager.fail_sync(e);
                            } else {
                                let blocks_received = !blocks.is_empty();
                                
                                if let crate::sync::SyncState::Syncing { peer, target_height } = sync_manager.get_state() {
                                    let current_height = chain.get_height();
                                    if current_height < *target_height {
                                        if blocks_received {
                                            println!("Requesting more blocks from {} (current: {}, target: {})", peer, current_height, target_height);
                                            let head_hash = chain.head.clone();
                                            network_client.request_blocks(*peer, head_hash, 100);
                                        } else {
                                            println!("Sync stalled: Received 0 blocks from {} while behind. Target: {}", peer, target_height);
                                            sync_manager.fail_sync("Stalled: Received 0 blocks".to_string());
                                        }
                                    }
                                }
                            }
                        }

                        SyncMessage::PeerConnected { peer_id } => {
                            println!("Peer connected: {}. Requesting chain info...", peer_id);
                            network_client.request_chain_info(peer_id);
                        }
                        SyncMessage::PeerDisconnected { peer_id } => {
                            println!("Peer disconnected: {}", peer_id);
                        }
                        SyncMessage::PeerIdentified { peer_id, protocol, address } => {
                            println!("Updated info for peer {}: {} @ {}", peer_id, protocol, address);
                            sync_manager.update_peer_metadata(peer_id, Some(address), Some(protocol));
                        }
                        SyncMessage::IncomingRequest { peer_id, request, channel } => {
                           match request {
                               crate::network::SyncRequest::GetChainInfo => {
                                   let height = chain.get_height();
                                   let head_hash = chain.head.clone();
                                   println!("Sending chain info to {}: height={}, head={}", peer_id, height, head_hash);
                                   let response = crate::network::SyncResponse::ChainInfo { height, head_hash };
                                   network_client.send_response(channel, response);
                               }
                               crate::network::SyncRequest::GetBlocks { start_hash, limit } => {
                                   println!("Received GetBlocks request from {}: start={}, limit={}", peer_id, start_hash, limit);
                                   let blocks = chain.get_blocks_range(&start_hash, limit);
                                   println!("Sending {} blocks to {}", blocks.len(), peer_id);
                                   let response = crate::network::SyncResponse::Blocks { blocks };
                                   network_client.send_response(channel, response);
                               }
                           }
                        }
                    }
                }
                
                // Handle CLI commands
                while let Ok(cmd) = cli_rx.try_recv() {
                    match cmd {
                        CliCommand::Info => {
                            println!("--- Node Info ---");
                            println!("Height: {}", chain.get_height());
                            println!("Head: {}", chain.head);
                            println!("Mempool: {} txs", mempool.len());
                            println!("Sync State: {:?}", sync_manager.get_state());
                            println!("Address: {}", hex::encode(my_address.clone()));
                            println!("Balance: {}", chain.state.get_balance(&my_address));
                            println!("-----------------");
                        }
                        CliCommand::ToggleSim => {
                            simulation_enabled = !simulation_enabled;
                            println!("Simulation mode: {}", simulation_enabled);
                        }
                        CliCommand::Help => {
                            println!("Commands: info, send <addr> <amt>, sim (toggle auto-tx)");
                        }
                        CliCommand::Send { receiver, amount } => { 
                            let recv_bytes = if receiver == "random" {
                                 Crypto::generate_keypair().public.to_bytes().to_vec()
                            } else {
                                 match hex::decode(&receiver) {
                                     Ok(b) => b,
                                     Err(_) => {
                                         println!("Invalid hex address");
                                         continue;
                                     }
                                 }
                            };
                            
                            let nonce = chain.state.get_nonce(&my_address);
                             let pending_nonce_offset = mempool.get_transactions_for_block(1000)
                                .iter()
                                .filter(|tx| tx.sender == my_address)
                                .count() as u64;
                                
                            let tx = crate::transaction::Transaction::new(
                                my_address.clone(),
                                recv_bytes,
                                crate::transaction::TransactionData::NativeTransfer { amount },
                                nonce + pending_nonce_offset,
                                &wallet_keypair
                            );
                            if let Ok(_) = mempool.add_transaction(tx.clone(), &chain.state) {
                                network_client.broadcast_transaction(tx.clone());
                                println!("Sent tx: {}", hex::encode(tx.hash()));
                            } else {
                                println!("Failed to create tx");
                            }
                        }
                    }
                }
                
                // Handle sync events
                while let Ok(event) = sync_event_rx.try_recv() {
                    match event {
                        SyncEvent::SyncStarted { peer, target_height } => {
                            println!("Sync started with peer {}, target height: {}", peer, target_height);
                        }
                        SyncEvent::SyncProgress { current_height, target_height } => {
                            println!("Sync progress: {}/{}", current_height, target_height);
                        }
                        SyncEvent::SyncCompleted => {
                            println!("Sync completed!");
                        }
                        SyncEvent::SyncFailed { reason } => {
                            eprintln!("Sync failed: {}", reason);
                        }
                    }
                }
                
                
                let current_slot = chain.consensus.get_current_slot();
                
                if !sync_manager.is_syncing() && current_slot > last_slot {
                    println!("Processing Slot: {}", current_slot);
                    last_slot = current_slot;
                    
                    // 1. Generate a random transaction
                    if simulation_enabled && rand::random::<f64>() < 0.5 {
                        let receiver = Crypto::generate_keypair().public.to_bytes().to_vec();
                        let amount = 10;
                        let nonce = chain.state.get_nonce(&my_address);
                        
                        let pending_nonce_offset = mempool.get_transactions_for_block(1000)
                            .iter()
                            .filter(|tx| tx.sender == my_address)
                            .count() as u64;
                            
                        let tx = crate::transaction::Transaction::new(
                            my_address.clone(),
                            receiver,
                            crate::transaction::TransactionData::NativeTransfer { amount },
                            nonce + pending_nonce_offset,
                            &wallet_keypair
                        );
                        
                        println!("Generated tx with nonce {}", tx.nonce);
                        
                        if let Ok(_) = mempool.add_transaction(tx.clone(), &chain.state) {
                            network_client.broadcast_transaction(tx);
                        }
                    }

                    // 2. Secret Leader Election Check
                    let parent = chain.get_head();
                    let seed = crate::consensus::Consensus::compute_vrf_seed(&parent.header.vrf_output, current_slot);
                    let (vrf_out, vrf_proof) = Crypto::vrf_sign(&validator_keypair, &seed);
                    let vrf_output_bytes = vrf_out.to_bytes().to_vec();
                    let vrf_proof_bytes = vrf_proof.to_bytes().to_vec();
                    let my_pubkey_bytes = validator_keypair.public.to_bytes();

                    if chain.validators.is_slot_leader(&my_pubkey_bytes, &vrf_output_bytes) {
                         println!("🎰 Won Secret Leader Election for slot {}", current_slot);
                    } else {
                        // Not a leader
                        continue;
                    }

                    // 3. Produce block
                    println!("⛏️  Mining: Check mempool (size: {})", mempool.len());
                    let transactions = mempool.get_transactions_for_block(100);
                    println!("⛏️  Mining: Selected {} txs for block", transactions.len());
                    
                    let new_header = BlockHeader {
                        parent_hash: parent.hash.clone(),
                        slot: current_slot,
                        epoch: chain.consensus.get_epoch(current_slot),
                        vrf_output: vrf_output_bytes,
                        vrf_proof: vrf_proof_bytes,
                        validator_pubkey: validator_keypair.public.to_bytes().to_vec(),
                        producer_signature: vec![],
                        state_root: "".to_string(),
                        tx_root: "".to_string(),
                        extra_witnesses: vec![],
                        timestamp: Utc::now().timestamp_millis(),
                    };
                    
                    // 4. Pruning Maintenance
                    if current_slot > 0 && current_slot % 100 == 0 {
                        let prune_target = chain.get_height().saturating_sub(1000); // Keep last 1000 blocks
                        if prune_target > 0 {
                            println!("🧹 Pruning blocks before height {}", prune_target);
                            if let Ok(count) = chain.storage.prune_blocks_before(prune_target, &chain.head) {
                                if count > 0 {
                                     println!("Deleted {} old blocks", count);
                                }
                            }
                        }
                    }
                    
                    let new_block = Block::new(new_header, transactions.clone());
                    
                    if chain.add_block(new_block.clone()) {
                        println!("Produced and added block for slot {}: {} with {} txs", 
                            current_slot, new_block.hash, new_block.transactions.len());
                        
                        mempool.remove_transactions(&transactions);
                        println!("🧹 Mining: Removed {} txs from mempool. New size: {}", transactions.len(), mempool.len());
                        
                        network_client.broadcast_block(new_block.clone());
                        println!("Broadcasted block");

                        // VOTE for our own block
                        let context = schnorrkel::context::signing_context(b"nocostcoin-vote");
                        let message = new_block.hash.as_bytes();
                        let signature = validator_keypair.sign(context.bytes(message)).to_bytes().to_vec();
                        
                        let vote = Vote {
                            block_hash: new_block.hash.clone(),
                            slot: new_block.header.slot,
                            validator_pubkey: validator_keypair.public.to_bytes().to_vec(),
                            signature,
                        };
                        
                        network_client.broadcast_vote(vote.clone());
                        chain.add_vote(vote);   
                    } else {
                        println!("Failed to add block for slot {}", current_slot);
                    }
                }
                
                // Check for incoming blocks
                while let Ok(block) = block_rx.try_recv() {
                    println!("Received block from network: {} for slot {}", block.hash, block.header.slot);
                    if chain.add_block(block.clone()) {
                        println!("✓ Accepted block from network for slot {}", block.header.slot);
                        println!("Added received block to chain");
                        mempool.remove_transactions(&block.transactions);
                        println!("🧹 Network: Removed {} txs from mempool (incoming block). New size: {}", block.transactions.len(), mempool.len());
                        
                        // VOTE for this block
                        let head = chain.get_head();
                        if head.hash == block.hash {
                            let context = schnorrkel::context::signing_context(b"nocostcoin-vote");
                            let message = head.hash.as_bytes();
                            let signature = validator_keypair.sign(context.bytes(message)).to_bytes().to_vec();
                            
                            let vote = Vote {
                                block_hash: head.hash.clone(),
                                slot: head.header.slot,
                                validator_pubkey: validator_keypair.public.to_bytes().to_vec(),
                                signature,
                            };
                            
                            network_client.broadcast_vote(vote.clone());
                            chain.add_vote(vote);
                        }
                    } else {
                        // Block rejected
                    }
                }
                
                // Check for incoming transactions
                while let Ok(tx) = tx_rx.try_recv() {
                    println!("Received transaction from network");
                    if let Err(e) = mempool.add_transaction(tx, &chain.state) {
                        println!("Failed to add tx to mempool: {}", e);
                    } else {
                        println!("Added tx to mempool");
                    }
                }
                
                // Handle API commands
                while let Ok(cmd) = api_rx.try_recv() {
                    match cmd {
                        crate::api::ApiCommand::GetStats(respond_to) => {
                             let stats = crate::api::NodeStats {
                                 height: chain.get_height(),
                                 head_hash: chain.head.clone(),
                                 peer_count: sync_manager.get_peers().len(),
                                 balance: chain.state.get_balance(&my_address),
                                 address: hex::encode(my_address.clone()),
                             };
                             let _ = respond_to.send(stats);
                        }
                        crate::api::ApiCommand::GetLatestBlock(respond_to) => {
                            let block = chain.get_block(&chain.head);
                            let _ = respond_to.send(block);
                        }
                        crate::api::ApiCommand::GetBlock(hash, respond_to) => {
                            let block = chain.get_block(&hash);
                            let _ = respond_to.send(block);
                        }
                        crate::api::ApiCommand::SubmitTransaction(tx, respond_to) => {
                            let hash = hex::encode(tx.hash());
                             if let Ok(_) = mempool.add_transaction(tx.clone(), &chain.state) {
                                 network_client.broadcast_transaction(tx);
                                 let _ = respond_to.send(Ok(hash));
                             } else {
                                 let _ = respond_to.send(Err("Failed to add transaction to mempool".to_string()));
                             }
                        }
                        crate::api::ApiCommand::CreateTransaction(req, respond_to) => {
                            let receiver_bytes = match hex::decode(&req.receiver) {
                                Ok(b) => b,
                                Err(_) => {
                                    let _ = respond_to.send(Err("Invalid receiver hex".to_string()));
                                    continue;
                                }
                            };
                            
                            let nonce = chain.state.get_nonce(&my_address);
                            
                            // Account for pending transactions in mempool
                            let pending_nonce_offset = mempool.get_transactions_for_block(1000)
                                .iter()
                                .filter(|tx| tx.sender == my_address)
                                .count() as u64;
                            
                            let tx = crate::transaction::Transaction::new(
                                my_address.clone(),
                                receiver_bytes,
                                crate::transaction::TransactionData::NativeTransfer { amount: req.amount },
                                nonce + pending_nonce_offset,
                                &wallet_keypair
                            );
                            
                            let hash = hex::encode(tx.hash());

                            if let Ok(_) = mempool.add_transaction(tx.clone(), &chain.state) {
                                 network_client.broadcast_transaction(tx);
                                 let _ = respond_to.send(Ok(hash));
                            } else {
                                 let _ = respond_to.send(Err("Failed to add transaction to mempool (balance insufficient?)".to_string()));
                            }
                        }
                        crate::api::ApiCommand::GetMempool(respond_to) => {
                            let txs = mempool.get_all();
                            let _ = respond_to.send(txs);
                        }
                        crate::api::ApiCommand::GetPeers(respond_to) => {
                             let peers_map = sync_manager.get_peers();
                             let peers: Vec<crate::api::PeerInfo> = peers_map.into_iter().map(|(id, state)| {
                                 crate::api::PeerInfo {
                                     id: id.to_string(),
                                     height: state.height,
                                     address: state.address,
                                     protocol: state.protocol,
                                     latency: None, // Latency tracking to be added later
                                 }
                             }).collect();
                             let _ = respond_to.send(peers);
                        }
                        crate::api::ApiCommand::CreateWallet(respond_to) => {
                            let (wallet, mnemonic) = crate::wallet::Wallet::create_wallet();
                            wallet_keypair = wallet.keypair; // Update volatile keypair
                            my_address = wallet_keypair.verifying_key().to_bytes().to_vec(); // Update volatile address
                            
                            // Save to file
                            let wallet_storage = crate::wallet::Wallet::from_keypair(wallet_keypair.clone());
                            if let Err(e) = wallet_storage.save_to_file(&wallet_path) {
                                println!("Failed to save wallet: {}", e);
                            } else {
                                println!("Wallet created and saved to {:?}", wallet_path);
                            }

                            let response = crate::api::CreateWalletResponse {
                                mnemonic,
                                address: hex::encode(&my_address),
                            };
                            let _ = respond_to.send(response);
                        }
                        crate::api::ApiCommand::RecoverWallet(req, respond_to) => {
                            match crate::wallet::Wallet::recover_wallet(&req.mnemonic) {
                                Ok(wallet) => {
                                    wallet_keypair = wallet.keypair; // Update volatile
                                    my_address = wallet_keypair.verifying_key().to_bytes().to_vec(); // Update volatile
                                    
                                    // Save to file
                                    let wallet_storage = crate::wallet::Wallet::from_keypair(wallet_keypair.clone());
                                    if let Err(e) = wallet_storage.save_to_file(&wallet_path) {
                                        println!("Failed to save wallet: {}", e);
                                    } else {
                                        println!("Wallet recovered and saved to {:?}", wallet_path);     
                                    }

                                    let _ = respond_to.send(Ok(hex::encode(&my_address)));
                                }
                                Err(e) => {
                                    let _ = respond_to.send(Err(e));
                                }
                            }
                        }
                        crate::api::ApiCommand::GetValidatorStatus(address_opt, respond_to) => {
                            // If an address is specified, check that address's validator status
                            // Otherwise, return the node's own validator status
                            let check_address: Vec<u8> = if let Some(addr_hex) = address_opt {
                                // Try to decode the hex address
                                match hex::decode(&addr_hex) {
                                    Ok(decoded) if decoded.len() == 32 => decoded,
                                    _ => {
                                        // Invalid address format, return None
                                        let _ = respond_to.send(None);
                                        continue;
                                    }
                                }
                            } else {
                                my_address.clone()
                            };
                            
                            let validator = chain.validators.get_validator(&check_address);
                            let response = validator.map(|v| crate::api::ValidatorStatusResponse {
                                pubkey: hex::encode(&check_address),
                                stake: v.stake,
                                is_active: v.stake > 0, // Simplified check
                                last_voted_slot: 0, // TODO: Track last voted slot in Validator struct or locally here
                            });
                            let _ = respond_to.send(response);
                        }
                        crate::api::ApiCommand::GetConsensusState(respond_to) => {
                            let response = crate::api::ConsensusStateResponse {
                                finalized_block_hash: chain.finalized_head.clone(),
                                finalized_height: chain.get_block(&chain.finalized_head).map(|b| b.header.slot).unwrap_or(0),
                                current_epoch: chain.consensus.get_epoch(chain.get_height()), // Epoch of head
                                current_slot: chain.consensus.get_current_slot(),
                            };
                            let _ = respond_to.send(response);
                        }
                        crate::api::ApiCommand::Faucet(request, respond_to) => {
                            println!("🚰 Faucet request received for address: {}", request.address);
                            
                            // Validate and decode address
                            let receiver = match hex::decode(&request.address) {
                                Ok(bytes) => {
                                    if bytes.len() == 32 {
                                        bytes
                                    } else {
                                        println!("❌ Faucet: Invalid address length: {} bytes", bytes.len());
                                        let _ = respond_to.send(Err("Invalid address: must be 32 bytes (64 hex characters)".to_string()));
                                        continue;
                                    }
                                }
                                Err(e) => {
                                    println!("❌ Faucet: Invalid hex address: {}", e);
                                    let _ = respond_to.send(Err("Invalid address: must be valid hex".to_string()));
                                    continue;
                                }
                            };
                            
                            // Check rate limiting
                            let current_time = chrono::Utc::now().timestamp_millis();
                            match chain.storage.can_claim(&receiver, current_time) {
                                Ok(can_claim) => {
                                    if !can_claim {
                                        println!("⏳ Faucet: Address on cooldown");
                                        // Calculate time remaining
                                        if let Ok(Some(remaining_ms)) = chain.storage.get_claim_cooldown_remaining(&receiver, current_time) {
                                            let remaining_hours = remaining_ms / (60 * 60 * 1000);
                                            let _ = respond_to.send(Err(format!(
                                                "Faucet cooldown active. Please wait {} hours before claiming again.", 
                                                remaining_hours
                                            )));
                                        } else {
                                            let _ = respond_to.send(Err("Faucet cooldown active. Please wait 24 hours between claims.".to_string()));
                                        }
                                        continue;
                                    }
                                }
                                Err(e) => {
                                    println!("❌ Faucet: Failed to check claim status: {}", e);
                                    let _ = respond_to.send(Err(format!("Failed to check claim status: {}", e)));
                                    continue;
                                }
                            }
                            
                            // Send tokens
                            let amount = 1000; // Faucet amount
                            let current_balance = chain.state.get_balance(&my_address);
                            
                            println!("💰 Faucet: Node balance: {} tokens, requested: {} tokens", current_balance, amount);
                            
                            // Check if node has sufficient balance
                            if current_balance < amount {
                                println!("❌ Faucet: Insufficient node balance ({} < {})", current_balance, amount);
                                let _ = respond_to.send(Err(format!(
                                    "Faucet temporarily unavailable: Node balance too low ({} tokens). Please try another node or wait for the node to receive more tokens.",
                                    current_balance
                                )));
                                continue;
                            }
                            
                            let nonce = chain.state.get_nonce(&my_address);
                            
                            // Account for pending transactions in mempool
                            let pending_nonce_offset = mempool.get_transactions_for_block(1000)
                                .iter()
                                .filter(|tx| tx.sender == my_address)
                                .count() as u64;
                            
                            let final_nonce = nonce + pending_nonce_offset;
                            println!("🔢 Faucet: Using nonce {} (state: {}, pending offset: {})", final_nonce, nonce, pending_nonce_offset);
                            
                            let tx = crate::transaction::Transaction::new(
                                my_address.clone(),
                                receiver.clone(),
                                crate::transaction::TransactionData::NativeTransfer { amount },
                                final_nonce,
                                &wallet_keypair
                            );
                            
                            let hash = hex::encode(tx.hash());
                            println!("📝 Faucet: Created transaction with hash: {}", hash);

                            if let Ok(_) = mempool.add_transaction(tx.clone(), &chain.state) {
                                println!("✓ Faucet: Transaction added to mempool. Size: {}", mempool.len());
                                network_client.broadcast_transaction(tx);
                                println!("📡 Faucet: Transaction broadcasted to network");
                                
                                // Record the claim
                                if let Err(e) = chain.storage.record_faucet_claim(&receiver, current_time) {
                                    eprintln!("⚠️  Warning: Failed to record faucet claim: {}", e);
                                }
                                
                                // Calculate next claim time
                                const COOLDOWN_MS: i64 = 24 * 60 * 60 * 1000;
                                let next_claim_time = current_time + COOLDOWN_MS;
                                
                                let response = crate::api::FaucetResponse {
                                    tx_hash: hash,
                                    amount,
                                    next_claim_time,
                                };
                                
                                println!("✅ Faucet: Successfully sent {} tokens to {}", amount, request.address);
                                let _ = respond_to.send(Ok(response));
                            } else {
                                println!("❌ Faucet: Failed to add transaction to mempool");
                                let _ = respond_to.send(Err("Faucet failed: insufficient balance or invalid transaction".to_string()));
                            }
                        }
                        crate::api::ApiCommand::GetBlocks(start_height_opt, limit, respond_to) => {
                            let head_height = chain.get_height();
                            let start_height = if start_height_opt == u64::MAX {
                                head_height
                            } else {
                                std::cmp::min(start_height_opt, head_height)
                            };
                            
                            let mut blocks = Vec::new();
                            let mut current_height = start_height;
                            
                            // Fetch blocks going backwards from start_height
                            for _ in 0..limit {
                                if let Ok(Some(hash)) = chain.storage.get_block_by_height(current_height) {
                                    if let Some(block) = chain.get_block(&hash) {
                                        blocks.push(block);
                                    }
                                }
                                
                                if current_height == 0 {
                                    break;
                                }
                                current_height -= 1;
                            }
                            
                            let _ = respond_to.send(blocks);
                        }
                        crate::api::ApiCommand::GetAccount(address_str, respond_to) => {
                            if let Ok(address) = hex::decode(&address_str) {
                                let balance = chain.state.get_balance(&address);
                                let nonce = chain.state.get_nonce(&address);
                                
                                let response = crate::api::AccountResponse {
                                    address: address_str,
                                    balance,
                                    nonce,
                                };
                                let _ = respond_to.send(Some(response));
                            } else {
                                let _ = respond_to.send(None);
                            }
                        }
                        crate::api::ApiCommand::GetTransaction(hash, respond_to) => {
                            // 1. Check Mempool
                            // Loop through mempool logic is strict but doable
                            // In real impl, mempool would map hash -> tx
                            let mempool_tx = mempool.transactions.values().find(|tx| hex::encode(tx.hash()) == hash);
                            
                            if let Some(tx) = mempool_tx {
                                let response = crate::api::TransactionResponse {
                                    hash: hash.clone(),
                                    transaction: tx.clone(),
                                    block_hash: String::new(), // Not in a block
                                    status: "pending".to_string(),
                                };
                                let _ = respond_to.send(Some(response));
                                continue;
                            }
                            
                            // 2. Check Storage Index
                            match chain.storage.get_transaction_block(&hash) {
                                Ok(Some(block_hash)) => {
                                    if let Some(block) = chain.get_block(&block_hash) {
                                         if let Some(tx) = block.transactions.iter().find(|t| hex::encode(t.hash()) == hash) {
                                             let response = crate::api::TransactionResponse {
                                                hash: hash.clone(),
                                                transaction: tx.clone(),
                                                block_hash,
                                                status: "confirmed".to_string(),
                                             };
                                             let _ = respond_to.send(Some(response));
                                             continue;
                                         }
                                    }
                                }
                                _ => {}
                            }
                            
                            let _ = respond_to.send(None);
                        }
                        crate::api::ApiCommand::GetAddressHistory(address, limit, respond_to) => {
                            let mut history = Vec::new();

                            // 1. Check Pending (Mempool) - Only for Sender
                            // Receiver pending is harder unless we index mempool by receiver too, but usually sender cares most about pending.
                            for tx in mempool.transactions.values() {
                                if hex::encode(&tx.sender) == address {
                                    history.push(crate::api::TransactionResponse {
                                        hash: hex::encode(tx.hash()),
                                        transaction: tx.clone(),
                                        block_hash: String::new(),
                                        status: "pending".to_string(),
                                    });
                                }
                            }
                            
                            // 2. Check Confirmed (Storage)
                            if let Ok(tx_hashes) = chain.storage.get_address_history(&address, limit) {
                                for hash in tx_hashes {
                                    if let Ok(Some(block_hash)) = chain.storage.get_transaction_block(&hash) {
                                        if let Some(block) = chain.get_block(&block_hash) {
                                            if let Some(tx) = block.transactions.iter().find(|t| hex::encode(t.hash()) == hash) {
                                                history.push(crate::api::TransactionResponse {
                                                    hash: hash.clone(),
                                                    transaction: tx.clone(),
                                                    block_hash,
                                                    status: "confirmed".to_string(),
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                            
                            let _ = respond_to.send(history);
                        }
                        crate::api::ApiCommand::GetValidators(respond_to) => {
                             let validators = chain.validators.get_all_validators().into_iter().map(|v| {
                                 crate::api::ValidatorStatusResponse {
                                     pubkey: hex::encode(v.pubkey),
                                     stake: v.stake,
                                     is_active: !v.slashed,
                                     last_voted_slot: 0, // Placeholder
                                 }
                             }).collect();
                             let _ = respond_to.send(validators);
                        }
                        crate::api::ApiCommand::RegisterValidator(stake, respond_to) => {
                             // Create and sign a transaction to register as validator
                             // 1. Get address info
                             let sender_pubkey_bytes = keypair.public.to_bytes().to_vec();
                             
                             let balance = chain.state.get_balance(&sender_pubkey_bytes);
                             let nonce = chain.state.get_nonce(&sender_pubkey_bytes);
                             
                             if balance < stake {
                                 let _ = respond_to.send(Err("Insufficient balance".to_string()));
                                 continue;
                             }
                             
                             // 2. Create Transaction
                             let tx = crate::transaction::Transaction::new(
                                 sender_pubkey_bytes.clone(),
                                 vec![], // No receiver for registration
                                 crate::transaction::TransactionData::RegisterValidator { stake },
                                 nonce,
                                 &keypair,
                             );
                             
                             // 3. Add to Mempool
                             match mempool.add_transaction(tx.clone(), &chain.state) {
                                 Ok(_) => {
                                      // 4. Broadcast
                                      network_client.broadcast_transaction(tx.clone());
                                      let _ = respond_to.send(Ok(hex::encode(tx.hash())));
                                 },
                                 Err(e) => {
                                      let _ = respond_to.send(Err(e));
                                 }
                             }
                        }
                    }
                }
                
                tokio::time::sleep(Duration::from_millis(100)).await;
            }
            
        });

        // Wait for tasks to complete
        tokio::select! {
            _ = network_handle => println!("Network task completed"),
            _ = blockchain_handle => println!("Blockchain task completed"),
        }
    }
}

