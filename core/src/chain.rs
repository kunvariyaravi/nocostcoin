use crate::block::Block;
use crate::consensus::Consensus;
use crate::state::State;
use crate::validator::ValidatorSet;
use crate::transaction::Transaction;
use crate::storage::Storage;
use crate::vote::Vote;
use std::collections::HashMap;
use schnorrkel::PublicKey;
use metrics::{gauge, counter, histogram};
use std::time::Instant;

pub struct Chain {
    pub storage: Storage,
    pub head: String, // Hash of the current head
    pub consensus: Consensus,
    pub state: State,
    pub validators: ValidatorSet,
    /// Track seen block headers per slot to detect equivocation
    /// Key: (slot, validator_pubkey), Value: block_hash
    seen_headers: HashMap<(u64, Vec<u8>), String>,
    
    /// Votes for blocks: BlockHash -> List of Votes
    pub votes: HashMap<String, Vec<Vote>>,
    
    /// Hash of the latest finalized block
    pub finalized_head: String,
}

impl Chain {
    pub fn new(storage: Storage, genesis_block: Block, genesis_time: i64) -> Self {
        // Check if we have a head in storage
        let head = if let Ok(Some(h)) = storage.get_head() {
            tracing::info!("Loaded existing chain head: {}", h);
            h
        } else {
            // Initialize with genesis
            tracing::info!("Initializing new chain with genesis: {}", genesis_block.hash);
            storage.store_block(&genesis_block).expect("Failed to store genesis block");
            storage.store_head(&genesis_block.hash).expect("Failed to store genesis head");
            genesis_block.hash.clone()
        };
        
        Self {
            storage: storage.clone(),
            head: head.clone(),
            consensus: Consensus::new(genesis_time),
            state: State::new(storage),
            validators: ValidatorSet::new(),
            seen_headers: HashMap::new(),
            votes: HashMap::new(),
            finalized_head: head, // Initially genesis is finalized
        }
    }

    pub fn add_block(&mut self, block: Block) -> bool {
        let start = Instant::now();
        // 1. Basic Validation
        // Check if parent exists in storage
        let parent_block = match self.storage.get_block(&block.header.parent_hash) {
            Ok(Some(b)) => b,
            _ => return false, // Parent not found
        };



        // 1b. Equivocation Detection (Double Signing)
        let slot = block.header.slot;
        let validator_pubkey = block.header.validator_pubkey.clone();
        let key = (slot, validator_pubkey.clone());
        
        // Check memory first, then disk
        let existing_hash_opt = self.seen_headers.get(&key).cloned().or_else(|| {
             self.storage.get_seen_header(slot, &validator_pubkey).ok().flatten()
        });

        if let Some(existing_hash) = existing_hash_opt {
            if existing_hash != block.hash {
                tracing::error!("EQUIVOCATION DETECTED! Validator {:?} signed two different blocks for slot {}", 
                    validator_pubkey, slot);
                tracing::error!("Existing block: {}, New block: {}", existing_hash, block.hash);
                
                // Slash the validator
                if let Err(e) = self.validators.slash_validator(&validator_pubkey) {
                    tracing::error!("Failed to slash validator: {}", e);
                } else {
                    tracing::info!("Validator slashed successfully");
                }
                
                // Reject this block
                return false;
            }
        } else {
            // Record this block header in memory and disk
            self.seen_headers.insert(key, block.hash.clone());
            if let Err(e) = self.storage.store_seen_header(slot, &validator_pubkey, &block.hash) {
                tracing::warn!("Failed to persist seen header: {}", e);
            }
        }

        // 2. Consensus / PoS Validation
        if let Err(e) = self.consensus.validate_block(&block, &parent_block, &self.validators) {
            tracing::warn!("Block rejected by consensus: {}", e);
            return false;
        }

        // 3. Validate and process transactions (ATOMIC)
        self.state.discard_changes(); // Ensure clean slate
        for tx in &block.transactions {
            if let Err(_) = self.process_transaction(tx) {
                self.state.discard_changes(); // Rollback
                return false; 
            }
        }

        // 3b. Verify state_root (if provided in block header)
        // Note: For genesis or blocks without state_root, we skip this check
        if !block.header.state_root.is_empty() {
            let calculated_state_root = self.state.get_root_hash();
            if block.header.state_root != calculated_state_root {
                tracing::error!("State root mismatch. Expected: {}, Got: {}", 
                    block.header.state_root, calculated_state_root);
                self.state.discard_changes();
                return false;
            }
        }

        // 4. Fork Choice
        let current_head_block = self.get_head();
        
        if Consensus::is_better_block(&block, &current_head_block) {
            self.head = block.hash.clone();
            if let Err(e) = self.storage.store_head(&self.head) {
                tracing::error!("Failed to store head: {}", e);
            }
        }

        if let Err(e) = self.storage.store_block(&block) {
            tracing::error!("Failed to store block: {}", e);
            self.state.discard_changes(); // Rollback if block storage fails
            return false;
        }

        // 5. Commit State Changes
        if let Err(e) = self.state.apply_changes() {
            tracing::error!("Failed to apply state changes: {}", e);
            return false;
        }

        // Index block by height
        if let Err(e) = self.storage.store_block_by_height(block.header.slot, &block.hash) {
            tracing::error!("Failed to index block by height: {}", e);
        }

        // Index transactions and Address History
        for tx in &block.transactions {
            // Validator Management Logic (after state applied balance changes)
            match &tx.data {
                 crate::transaction::TransactionData::RegisterValidator { stake } => {
                     // Balance is already deducted by state.apply_transaction
                     if let Err(e) = self.validators.register_validator(tx.sender.clone(), *stake, block.header.epoch) {
                         println!("Failed to register validator: {}", e);
                         // TODO: If this fails, we should technically revert the transaction or handle it.
                         // For now, if state applied it (deducted balance), but this fails, user loses money?
                         // Ideally validate_block logic checks this BEFORE execution.
                         // We are safe because register_validator checks duplicate.
                         // BUT min stake check is in validate_logic? No, just >0.
                         // Core logic should be consistent.
                     }
                 },
                 crate::transaction::TransactionData::UnregisterValidator => {
                     match self.validators.unregister_validator(&tx.sender) {
                         Ok(stake) => {
                             // Refund stake
                             let mut account = self.state.get_account(&tx.sender).unwrap_or(crate::state::Account::new(0));
                             account.balance += stake;
                             self.state.pending_changes.insert(tx.sender.clone(), account);
                         },
                         Err(e) => println!("Failed to unregister validator: {}", e),
                     }
                 },
                 _ => {}
            }

            let tx_hash = hex::encode(tx.hash());
            
            // 1. Index Tx -> Block
            if let Err(e) = self.storage.store_transaction_index(&tx_hash, &block.hash) {
                 println!("Failed to index transaction: {}", e);
            }
            
            // 2. Index Address History (Sender)
            let sender_hex = hex::encode(&tx.sender);
            if let Err(e) = self.storage.add_transaction_to_address(&sender_hex, &tx_hash) {
                println!("Failed to index history for sender: {}", e);
            }
            
            // 3. Index Address History (Receiver)
            let receiver_hex = hex::encode(&tx.receiver);
            if let Err(e) = self.storage.add_transaction_to_address(&receiver_hex, &tx_hash) {
                tracing::error!("Failed to index history for receiver: {}", e);
            }
        }
        
        // Metrics Update
        gauge!("block_height", block.header.slot as f64);
        counter!("transaction_count", block.transactions.len() as u64);
        histogram!("block_processing_time", start.elapsed());

        true
    }

    /// Process a transaction and update state
    pub fn process_transaction(&mut self, tx: &Transaction) -> Result<(), String> {
        // Validate transaction
        tx.validate()?;

        // Execute transaction logic
        self.state.apply_transaction(tx)?;

        Ok(())
    }

    pub fn get_head(&self) -> Block {
        self.storage.get_block(&self.head).unwrap().expect("Head block not found in storage")
    }

    /// Get current chain height (slot number of head block)
    pub fn get_height(&self) -> u64 {
        self.get_head().header.slot
    }

    /// Get a specific block by hash
    pub fn get_block(&self, hash: &str) -> Option<Block> {
        self.storage.get_block(hash).ok().flatten()
    }

    /// Get blocks starting from a hash (for sync)
    pub fn get_blocks_range(&self, start_hash: &str, limit: usize) -> Vec<Block> {
        let mut blocks = Vec::new();
        
        // First get the start block to know its height
        if let Some(start_block) = self.get_block(start_hash) {
            let start_height = start_block.header.slot;
            
            // Now we can iterate by height
            for i in 0..limit {
                let target_height = start_height + i as u64;
                
                if let Ok(Some(hash)) = self.storage.get_block_by_height(target_height) {
                    if let Some(block) = self.get_block(&hash) {
                        blocks.push(block);
                    } else {
                        break; // Block hash found but content missing (shouldn't happen)
                    }
                } else {
                    break; // No block at this height
                }
            }
        }

        blocks
    }
    /// Add a vote to the chain and check for finality
    pub fn add_vote(&mut self, vote: Vote) -> bool {
        // 1. Basic Checks
        if !self.validators.is_validator(&vote.validator_pubkey) {
            return false;
        }

        // 2. Verify Signature
        if let Ok(pubkey) = PublicKey::from_bytes(&vote.validator_pubkey) {
            let context = schnorrkel::context::signing_context(b"nocostcoin-vote");
            let message = vote.block_hash.as_bytes();
            if let Ok(sig) = schnorrkel::Signature::from_bytes(&vote.signature) {
                if pubkey.verify(context.bytes(message), &sig).is_err() {
                    println!("Invalid vote signature");
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }

        // 3. Store Vote (Avoid duplicates)
        let votes = self.votes.entry(vote.block_hash.clone()).or_insert(Vec::new());
        if votes.iter().any(|v| v.validator_pubkey == vote.validator_pubkey) {
            return false; // Already voted
        }
        votes.push(vote.clone());
        
        // Persist vote
        if let Err(e) = self.storage.store_vote(&vote) {
            println!("Failed to store vote: {}", e);
        }

        // 4. Check for Finality
        self.check_finality(&vote.block_hash);

        true
    }

    fn check_finality(&mut self, block_hash: &str) {
        if let Some(votes) = self.votes.get(block_hash) {
            let mut total_vote_stake = 0;
            let total_stake = self.validators.get_total_stake();
            
            for vote in votes {
                if let Some(validator) = self.validators.get_validator(&vote.validator_pubkey) {
                    total_vote_stake += validator.stake;
                }
            }

            // Threshold: > 2/3 of total stake
            if total_stake > 0 && total_vote_stake as f64 > (total_stake as f64 * 0.6666) {
                if self.finalized_head != *block_hash {
                    tracing::info!("🎉 BLOCK FINALIZED: {} (Stake: {}/{})", block_hash, total_vote_stake, total_stake);
                    
                    // Update finalized head
                    self.finalized_head = block_hash.to_string();
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use crate::block::BlockHeader;
    use crate::crypto::Crypto;

    fn create_genesis() -> Block {
        Block {
            header: BlockHeader {
                parent_hash: "0".to_string(),
                slot: 0,
                epoch: 0,
                validator_pubkey: vec![],
                producer_signature: vec![],
                state_root: "".to_string(),
                tx_root: "".to_string(),
                extra_witnesses: vec![],
                vrf_proof: vec![],
                vrf_output: vec![],
                timestamp: 0,
            },
            hash: "genesis".to_string(),
            transactions: vec![],
        }
    }

    fn create_next_block(parent: &Block, slot: u64) -> Block {
        Block {
            header: BlockHeader {
                parent_hash: parent.hash.clone(),
                slot,
                epoch: 0,
                validator_pubkey: vec![],
                producer_signature: vec![],
                state_root: "".to_string(),
                tx_root: "".to_string(),
                extra_witnesses: vec![],
                vrf_proof: vec![],
                vrf_output: vec![],
                timestamp: (slot * 2000) as i64, 
            },
            hash: format!("block-{}", slot),
            transactions: vec![],
        }
    }

    #[test]
    fn test_chain_init() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        let genesis = create_genesis();
        let chain = Chain::new(storage, genesis.clone(), 0);

        assert_eq!(chain.head, genesis.hash);
        assert_eq!(chain.get_height(), 0);
    }

    #[test]
    fn test_add_block() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        let genesis = create_genesis();
        let mut chain = Chain::new(storage, genesis.clone(), 0);

        // Register a validator
        let keypair = Crypto::generate_keypair();
        let pubkey = keypair.public.to_bytes().to_vec();
        chain.validators.register_validator(pubkey.clone(), 1000, 0).unwrap();

        // Create a block
        let mut block = create_next_block(&genesis, 1);
        block.header.validator_pubkey = pubkey.clone();
        
        // Generate VRF
        let seed = Consensus::compute_vrf_seed(&genesis.header.vrf_output, block.header.slot);
        let (vrf_preout, vrf_proof) = Crypto::vrf_sign(&keypair, &seed);
        block.header.vrf_output = vrf_preout.to_bytes().to_vec();
        block.header.vrf_proof = vrf_proof.to_bytes().to_vec();

        assert!(chain.add_block(block.clone()));
        
        assert_eq!(chain.head, block.hash);
        assert_eq!(chain.get_height(), 1);
    }

    #[test]
    fn test_add_block_invalid_parent() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        let genesis = create_genesis();
        let mut chain = Chain::new(storage, genesis.clone(), 0);

        // Block with non-existent parent
        let mut block_invalid = create_next_block(&genesis, 1);
        block_invalid.header.parent_hash = "non-existent".to_string();

        assert!(!chain.add_block(block_invalid));
        assert_eq!(chain.get_height(), 0);
    }
    #[test]
    fn test_atomic_state_rollback() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        let genesis = create_genesis();
        let mut chain = Chain::new(storage, genesis.clone(), 0);

        // Register a validator
        let keypair = Crypto::generate_keypair();
        let pubkey = keypair.public.to_bytes().to_vec();
        chain.validators.register_validator(pubkey.clone(), 1000, 0).unwrap();

        // Setup: Fund sender
        let sender_pair = Crypto::generate_keypair();
        let sender = sender_pair.public.to_bytes().to_vec();
        let receiver_pair = Crypto::generate_keypair();
        let receiver = receiver_pair.public.to_bytes().to_vec();

        chain.state.set_balance(sender.clone(), 100);
        chain.state.apply_changes().unwrap();

        // Create valid block header (consensus pass)
        let mut block = create_next_block(&genesis, 1);
        block.header.validator_pubkey = pubkey.clone();
        
        let seed = Consensus::compute_vrf_seed(&genesis.header.vrf_output, block.header.slot);
        let (vrf_preout, vrf_proof) = Crypto::vrf_sign(&keypair, &seed);
        block.header.vrf_output = vrf_preout.to_bytes().to_vec();
        block.header.vrf_proof = vrf_proof.to_bytes().to_vec();
        
        let tx1 = Transaction::new(sender.clone(), receiver.clone(), crate::transaction::TransactionData::NativeTransfer { amount: 10 }, 0, &sender_pair); // Valid
        let tx2 = Transaction::new(sender.clone(), receiver.clone(), crate::transaction::TransactionData::NativeTransfer { amount: 1000 }, 1, &sender_pair); // Invalid (nsf)

        block.transactions = vec![tx1, tx2];

        // Should fail
        assert!(!chain.add_block(block));

        // State should be unchanged (100)
        assert_eq!(chain.state.get_balance(&sender), 100);
    }
}
