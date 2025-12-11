mod block;
mod crypto;
mod transaction;
mod consensus;
mod chain;
mod state;
mod validator;
mod storage;
mod network;
mod mempool;
mod sync;
mod wallet;
mod vote;
mod trie;
mod api;

use vote::Vote;

use crate::network::{NetworkConfig, NetworkNode, SyncMessage};
use crate::crypto::Crypto;
use crate::wallet::Wallet;
use crate::block::{Block, BlockHeader};
use crate::chain::Chain;
use crate::mempool::Mempool;
use crate::sync::{SyncManager, SyncEvent};
use chrono::Utc;
use std::time::Duration;
use tokio::sync::mpsc;
use tokio::io::{AsyncBufReadExt, BufReader};

enum CliCommand {
    Info,
    Send { receiver: String, amount: u64 },
    ToggleSim,
    Help,
}

#[tokio::main]
async fn main() {
    println!("Starting Nocostcoin Node...");

    // Parse command-line arguments
    let args: Vec<String> = std::env::args().collect();
    let mut port = 9000;
    let mut bootstrap_peers = vec![];

    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--port" => {
                if i + 1 < args.len() {
                    port = args[i + 1].parse().unwrap_or(9000);
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "--bootstrap" => {
                if i + 1 < args.len() {
                    bootstrap_peers.push(args[i + 1].clone());
                    i += 2;
                } else {
                    i += 1;
                }
            }
            _ => i += 1,
        }
    }

    // Setup network configuration
    let network_config = NetworkConfig {
        listen_addr: format!("/ip4/0.0.0.0/tcp/{}", port),
        bootstrap_peers,
    };

    // Create channels for network communication
    let (block_tx, mut block_rx) = mpsc::unbounded_channel();
    let (tx_tx, mut tx_rx) = mpsc::unbounded_channel();
    let (sync_tx, mut sync_rx) = mpsc::unbounded_channel();
    let (sync_event_tx, mut sync_event_rx) = mpsc::unbounded_channel();

    let (cli_tx, mut cli_rx) = mpsc::unbounded_channel();
    let (vote_tx, mut vote_rx) = mpsc::unbounded_channel();
    let (api_tx, mut api_rx) = mpsc::unbounded_channel();
    
    // Calculate API port (e.g., node 9000 -> api 8000, 9001 -> 8001)
    let api_port = 8000 + (port - 9000);
    let api_config = crate::api::ApiConfig { port: api_port as u16 };
    
    tokio::spawn(async move {
        crate::api::start_api_server(api_config, api_tx).await;
    });

    // Initialize network node
    let (mut network_node, network_client) = NetworkNode::new(network_config, block_tx, tx_tx, vote_tx, sync_tx)
        .await
        .expect("Failed to create network node");

    // 1. Setup Genesis or Load Wallet
    // Use a fixed genesis time for deterministic genesis across all nodes
    let genesis_time = 1733760000000i64; // Fixed timestamp: Dec 9 2024
    
    // Helper to generate deterministic keypair from a seed string
    fn generate_deterministic_keypair(seed_str: &str) -> schnorrkel::Keypair {
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

    // Define devnet topology with deterministic seeds
    let devnet_nodes = vec![
        (9000, "nocostcoin_node_9000_seed"),
        (9001, "nocostcoin_node_9001_seed"), 
        (9002, "nocostcoin_node_9002_seed"),
    ];

    // Load or create wallet
    let wallet_path = format!("./wallet_{}.key", port);
    
    // For devnet ports, FORCE deterministic keys
    let keypair = if let Some((_, seed)) = devnet_nodes.iter().find(|(p, _)| *p == port) {
        println!("Devnet mode: Using deterministic key for port {}", port);
        // Always recreate/load the deterministic key for this port
        let kp = generate_deterministic_keypair(seed);
        
        // Save to file just for consistency/cli tools, but we use the generated one
        let w = Wallet::from_keypair(kp.clone());
        if let Err(e) = w.save_to_file(&wallet_path) {
            println!("Warning: Failed to save deterministic wallet: {}", e);
        }
        // If Wallet::from_keypair doesn't exist, we'll need to construct it manually or specific way.
        // Checking wallet.rs view... Wallet struct has keypair field.
        // Let's assume we can construct it or handle it. 
        // Note: The previous view of wallet.rs showed `from_keypair` is unused but present (warning).
        // If not, we can just save it.
        // Actually, let's just write the file if it's different or just rely on the keypair in memory.
        
        // We will overwrite the wallet file to match deterministic key
        // This ensures if user restarts, it's consistent.
        // Converting keypair to wallet might strictly need `Wallet` struct access.
        // Let's just assume we have the keypair in memory for now.
        
        // Wait, we need `wallet` object to save it. 
        // The check showed `pub fn from_keypair` exists.
        kp
    } else {
        // Normal non-devnet behavior
        match Wallet::load_from_file(&wallet_path) {
            Ok(w) => {
                println!("Loaded wallet from {}", wallet_path);
                w.keypair
            }
            Err(_) => {
                println!("Creating new wallet at {}", wallet_path);
                let w = Wallet::new();
                w.save_to_file(&wallet_path).expect("Failed to save wallet");
                w.keypair
            }
        }
    };
    
    // Save deterministic wallet to disk if we are a devnet node
    if devnet_nodes.iter().any(|(p, _)| *p == port) {
        // We need to construct a Wallet to save it. 
        // Since we can't easily see if Wallet::from_keypair is pub, let's try to use it.
        // If it fails compile, I'll fix.
        // Based on warnings "associated items `from_keypair` ... are never used", it implies it exists.
        let w = Wallet::from_keypair(keypair.clone());
        w.save_to_file(&wallet_path).expect("Failed to save deterministic wallet");
    }

    // Create TRULY deterministic genesis block (same for all nodes)
    // Use fixed VRF output and proof (no randomness)
    use schnorrkel::{MiniSecretKey, SecretKey};
    let genesis_mini_secret = MiniSecretKey::from_bytes(
        &[42u8; 32] // Fixed seed
    ).expect("Failed to create genesis secret");
    let genesis_secret: SecretKey = genesis_mini_secret.expand(schnorrkel::ExpansionMode::Ed25519);
    let genesis_keypair = genesis_secret.to_keypair();
    
    // Use FIXED VRF values (not generated, to avoid randomness)
    let genesis_vrf_output = vec![0u8; 32]; // Fixed output
    let genesis_vrf_proof = vec![0u8; 64];  // Fixed proof
    
    let genesis_header = BlockHeader {
        parent_hash: "0".to_string(),
        slot: 0,
        epoch: 0,
        vrf_output: genesis_vrf_output,
        vrf_proof: genesis_vrf_proof,
        validator_pubkey: genesis_keypair.public.to_bytes().to_vec(),
        producer_signature: vec![],
        state_root: "".to_string(),
        tx_root: "".to_string(),
        extra_witnesses: vec![],
        timestamp: genesis_time,
    };
    
    let genesis_block = Block::new(genesis_header, vec![]);
    
    println!("Deterministic genesis block hash: {}", genesis_block.hash);

    // Initialize Storage with unique path per port
    let db_path = format!("./nocostcoin_db_{}", port);
    let storage = crate::storage::Storage::new(db_path).expect("Failed to create storage");

    // Initialize Chain with Storage
    let mut chain = Chain::new(storage, genesis_block.clone(), genesis_time);

    // PRE-REGISTER ALL DEVNET VALIDATORS
    // This ensures every node has the exact same validator set at genesis
    println!("Pre-registering devnet validators...");
    for (_, seed) in devnet_nodes.iter() {
        let node_kp = generate_deterministic_keypair(seed);
        let node_pubkey = node_kp.public.to_bytes().to_vec();
        
        // Give them balance and register
        chain.state.set_balance(node_pubkey.clone(), 1_000_000);
        
        // We ignore error if already registered (idempotent)
        let _ = chain.validators.register_validator(node_pubkey, 1_000_000, 0);
    }
    
    // Register self if not in devnet_nodes (e.g. random port)
    // Funding self
    let my_address = keypair.public.to_bytes().to_vec();
    if chain.state.get_balance(&my_address) == 0 {
         chain.state.set_balance(my_address.clone(), 1_000_000);
         let _ = chain.validators.register_validator(my_address.clone(), 1_000_000, 0);
    }

    println!("Chain initialized with genesis: {}", genesis_block.hash);

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
        let mut last_slot = 0;
        let mut mempool = Mempool::new(1000); // Initialize Mempool
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
                    SyncMessage::ChainInfo { peer_id, height, head_hash: _ } => {
                        println!("Peer {} has height {}", peer_id, height);
                        sync_manager.update_peer_info(peer_id, height);
                        
                        // Check if we need to sync
                        let our_height = chain.get_height();
                        if let Some((sync_peer, target_height)) = sync_manager.should_sync(our_height) {
                            println!("Starting sync with peer {} (height: {})", sync_peer, target_height);
                            sync_manager.start_sync(sync_peer, target_height);
                            
                            // Request blocks from current head
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
                            // If still syncing, request more blocks
                            // ONLY if we actually received blocks (progress made)
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
                                        // Optional: Fail sync or try backtracking. For now, just stop to prevent spam.
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
                             // Try to decode hex
                             match hex::decode(&receiver) {
                                 Ok(b) => b,
                                 Err(_) => {
                                     println!("Invalid hex address");
                                     continue;
                                 }
                             }
                        };
                        
                        let nonce = chain.state.get_nonce(&my_address);
                        // Check mempool pending nonce?
                         let pending_nonce_offset = mempool.get_transactions_for_block(1000)
                            .iter()
                            .filter(|tx| tx.sender == my_address)
                            .count() as u64;
                            
                        let tx = crate::transaction::Transaction::new(
                            my_address.clone(),
                            recv_bytes,
                            amount,
                            nonce + pending_nonce_offset,
                            &keypair
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
            
            // Skip block production if syncing
            if sync_manager.is_syncing() {
                tokio::time::sleep(Duration::from_millis(500)).await;
                continue;
            }
            
            let current_slot = chain.consensus.get_current_slot();
            
            if current_slot > last_slot {
                println!("Processing Slot: {}", current_slot);
                last_slot = current_slot;
                
                // 1. Generate a random transaction
                if simulation_enabled && rand::random::<f64>() < 0.5 {
                    let receiver = Crypto::generate_keypair().public.to_bytes().to_vec();
                    let amount = 10;
                    let nonce = chain.state.get_nonce(&my_address);
                    
                    // Check if we have pending txs in mempool to increment nonce
                    // This is a simplified nonce management for simulation
                    let pending_nonce_offset = mempool.get_transactions_for_block(1000)
                        .iter()
                        .filter(|tx| tx.sender == my_address)
                        .count() as u64;
                        
                    let tx = crate::transaction::Transaction::new(
                        my_address.clone(),
                        receiver,
                        amount,
                        nonce + pending_nonce_offset,
                        &keypair
                    );
                    
                    println!("Generated tx with nonce {}", tx.nonce);
                    
                    if let Ok(_) = mempool.add_transaction(tx.clone(), &chain.state) {
                        network_client.broadcast_transaction(tx);
                    }
                }

                // 2. Secret Leader Election Check
                // We compute VRF privately to see if we won the slot
                let parent = chain.get_head();
                let seed = crate::consensus::Consensus::compute_vrf_seed(&parent.header.vrf_output, current_slot);
                let (vrf_out, vrf_proof) = Crypto::vrf_sign(&keypair, &seed);
                let vrf_output_bytes = vrf_out.to_bytes().to_vec();
                let vrf_proof_bytes = vrf_proof.to_bytes().to_vec();
                let my_pubkey_bytes = keypair.public.to_bytes();

                if chain.validators.is_slot_leader(&my_pubkey_bytes, &vrf_output_bytes) {
                     println!("🎰 Won Secret Leader Election for slot {}", current_slot);
                } else {
                    // Not a leader for this slot (and no one knows we checked!)
                    continue;
                }

                // 3. Produce block
                // (VRF and Parent already computed/retrieved above)
                
                // Get transactions from mempool
                let transactions = mempool.get_transactions_for_block(100);
                
                let new_header = BlockHeader {
                    parent_hash: parent.hash.clone(),
                    slot: current_slot,
                    epoch: chain.consensus.get_epoch(current_slot),
                    vrf_output: vrf_output_bytes,
                    vrf_proof: vrf_proof_bytes,
                    validator_pubkey: keypair.public.to_bytes().to_vec(),
                    producer_signature: vec![],
                    state_root: "".to_string(),
                    tx_root: "".to_string(),
                    extra_witnesses: vec![],
                    timestamp: Utc::now().timestamp_millis(),
                };
                
                let new_block = Block::new(new_header, transactions.clone());
                
                if chain.add_block(new_block.clone()) {
                    println!("Produced and added block for slot {}: {} with {} txs", 
                        current_slot, new_block.hash, new_block.transactions.len());
                    
                    // Remove included transactions from mempool
                    mempool.remove_transactions(&transactions);
                    
                    // 5. Broadcast block
                    network_client.broadcast_block(new_block.clone());
                    println!("Broadcasted block");

                    // VOTE for our own block
                    let context = schnorrkel::context::signing_context(b"nocostcoin-vote");
                    let message = new_block.hash.as_bytes();
                    let signature = keypair.sign(context.bytes(message)).to_bytes().to_vec();
                    
                    let vote = Vote {
                        block_hash: new_block.hash.clone(),
                        slot: new_block.header.slot,
                        validator_pubkey: keypair.public.to_bytes().to_vec(),
                        signature,
                    };
                    
                    network_client.broadcast_vote(vote.clone());
                    chain.add_vote(vote); // Add our own vote   
                    // Broadcast chain info periodically
                    // (In production, this would be done on peer connection)
                } else {
                    println!("Failed to add block for slot {}", current_slot);
                }
            }
            
            // Check for incoming blocks from network
            while let Ok(block) = block_rx.try_recv() {
                println!("Received block from network: {} for slot {}", block.hash, block.header.slot);
                if chain.add_block(block.clone()) {
                    println!("✓ Accepted block from network for slot {}", block.header.slot);
                        println!("Added received block to chain");
                        mempool.remove_transactions(&block.transactions);
                        
                        // VOTE for this block if it extends our chain
                        // We vote for the head of the chain (which should be this block or better)
                        let head = chain.get_head();
                        if head.hash == block.hash {
                            let context = schnorrkel::context::signing_context(b"nocostcoin-vote");
                            let message = head.hash.as_bytes();
                            let signature = keypair.sign(context.bytes(message)).to_bytes().to_vec();
                            
                            let vote = Vote {
                                block_hash: head.hash.clone(),
                                slot: head.header.slot,
                                validator_pubkey: keypair.public.to_bytes().to_vec(),
                                signature,
                            };
                            
                            network_client.broadcast_vote(vote.clone());
                            chain.add_vote(vote); // Add our own vote
                        }
                    } else {
                    // Block rejected - could be duplicate, invalid, or on worse fork
                    // This is normal and expected
                }
            }
            
            // Check for incoming transactions from network
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
                             peer_count: 0, // TODO: Get actual peer count from network_node if possible, or just 0 for now
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
                        // 1. Decode receiver
                        let receiver_bytes = match hex::decode(&req.receiver) {
                            Ok(b) => b,
                            Err(_) => {
                                let _ = respond_to.send(Err("Invalid receiver hex".to_string()));
                                continue;
                            }
                        };
                        
                        // 2. Get current nonce
                        let nonce = chain.state.get_nonce(&my_address);
                        
                        // 3. Create and sign transaction
                        let tx = crate::transaction::Transaction::new(
                            my_address.clone(),
                            receiver_bytes,
                            req.amount,
                            nonce,
                            &keypair
                        );
                        
                        let hash = hex::encode(tx.hash());

                        // 4. Add to mempool and broadcast
                        if let Ok(_) = mempool.add_transaction(tx.clone(), &chain.state) {
                             network_client.broadcast_transaction(tx);
                             let _ = respond_to.send(Ok(hash));
                        } else {
                             let _ = respond_to.send(Err("Failed to add transaction to mempool (balance insufficient?)".to_string()));
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
