use crate::block::Block;
use crate::state::Account;
use crate::vote::Vote;
use sled::Db;
use std::path::Path;

#[derive(Clone)]
pub struct Storage {
    db: Db,
}

impl Storage {
    /// Open or create a database at the given path
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let db = sled::open(path).map_err(|e| format!("Failed to open database: {}", e))?;
        Ok(Self { db })
    }

    /// Store a block
    pub fn store_block(&self, block: &Block) -> Result<(), String> {
        let key = format!("block:{}", block.hash);
        let value = bincode::serialize(block)
            .map_err(|e| format!("Failed to serialize block: {}", e))?;
        
        self.db
            .insert(key.as_bytes(), value)
            .map_err(|e| format!("Failed to store block: {}", e))?;
        
        Ok(())
    }

    /// Retrieve a block by hash
    pub fn get_block(&self, hash: &str) -> Result<Option<Block>, String> {
        let key = format!("block:{}", hash);
        let value = self.db
            .get(key.as_bytes())
            .map_err(|e| format!("Failed to get block: {}", e))?;
        
        match value {
            Some(bytes) => {
                let block = bincode::deserialize(&bytes)
                    .map_err(|e| format!("Failed to deserialize block: {}", e))?;
                Ok(Some(block))
            }
            None => Ok(None),
        }
    }

    /// Store a block hash by height
    pub fn store_block_by_height(&self, height: u64, hash: &str) -> Result<(), String> {
        let key = format!("height:{}", height);
        self.db
            .insert(key.as_bytes(), hash.as_bytes())
            .map_err(|e| format!("Failed to store block by height: {}", e))?;
        Ok(())
    }

    /// Retrieve a block hash by height
    pub fn get_block_by_height(&self, height: u64) -> Result<Option<String>, String> {
        let key = format!("height:{}", height);
        let value = self.db
            .get(key.as_bytes())
            .map_err(|e| format!("Failed to get block by height: {}", e))?;
        
        match value {
            Some(bytes) => {
                let hash = String::from_utf8(bytes.to_vec())
                    .map_err(|e| format!("Failed to decode block hash: {}", e))?;
                Ok(Some(hash))
            }
            None => Ok(None),
        }
    }

    /// Store the current chain head
    pub fn store_head(&self, hash: &str) -> Result<(), String> {
        self.db
            .insert(b"head", hash.as_bytes())
            .map_err(|e| format!("Failed to store head: {}", e))?;
        Ok(())
    }

    /// Retrieve the current chain head
    pub fn get_head(&self) -> Result<Option<String>, String> {
        let value = self.db
            .get(b"head")
            .map_err(|e| format!("Failed to get head: {}", e))?;
        
        match value {
            Some(bytes) => {
                let hash = String::from_utf8(bytes.to_vec())
                    .map_err(|e| format!("Failed to decode head: {}", e))?;
                Ok(Some(hash))
            }
            None => Ok(None),
        }
    }

    /// Store account state
    pub fn store_account(&self, address: &[u8], account: &Account) -> Result<(), String> {
        let key = [b"account:", address].concat();
        let value = bincode::serialize(account)
            .map_err(|e| format!("Failed to serialize account: {}", e))?;
        
        self.db
            .insert(&key, value)
            .map_err(|e| format!("Failed to store account: {}", e))?;
        
        Ok(())
    }

    /// Retrieve account state
    pub fn get_account(&self, address: &[u8]) -> Result<Option<Account>, String> {
        let key = [b"account:", address].concat();
        let value = self.db
            .get(&key)
            .map_err(|e| format!("Failed to get account: {}", e))?;
        
        match value {
            Some(bytes) => {
                let account = bincode::deserialize(&bytes)
                    .map_err(|e| format!("Failed to deserialize account: {}", e))?;
                Ok(Some(account))
            }
            None => Ok(None),
        }
    }

    /// Get all accounts (for rebuilding MPT on startup)
    pub fn get_all_accounts(&self) -> Result<Vec<(Vec<u8>, Account)>, String> {
        let mut accounts = Vec::new();
        let prefix = b"account:";
        
        for item in self.db.scan_prefix(prefix) {
            let (key, value) = item.map_err(|e| format!("Failed to scan accounts: {}", e))?;
            
            // Extract address (remove "account:" prefix)
            let address = key[prefix.len()..].to_vec();
            
            // Deserialize account
            let account: Account = bincode::deserialize(&value)
                .map_err(|e| format!("Failed to deserialize account: {}", e))?;
            
            accounts.push((address, account));
        }
        
        Ok(accounts)
    }

    /// Flush all pending writes
    #[allow(dead_code)]
    pub fn flush(&self) -> Result<(), String> {
        self.db
            .flush()
            .map_err(|e| format!("Failed to flush database: {}", e))?;
        Ok(())


    }

    /// Delete a block by hash and its metadata
    pub fn delete_block(&self, hash: &str) -> Result<(), String> {
        // Delete block data
        let block_key = format!("block:{}", hash);
        self.db
            .remove(block_key.as_bytes())
            .map_err(|e| format!("Failed to delete block: {}", e))?;
            
        Ok(())
    }

    /// Prune blocks older than a certain height
    /// Returns the number of blocks deleted
    pub fn prune_blocks_before(&self, target_height: u64, chain_head_hash: &str) -> Result<u64, String> {
        let mut deleted_count = 0;
        
        // Iterate through all keys to find "height:X" keys
        // Note: Ideally we would scan a range, but "height:" prefix with string numbers doesn't order lexicographically correct (height:10 < height:2).
        // Since we are using string keys "height:{}", we should scan carefully or change schema.
        // For simplicity now, let's just loop from 0 to target_height assuming contiguity.
        // If gaps exist, we might miss some, but it works for main chain.
        
        // BUT, we must NOT delete the genesis block (height 0) usually, or ensure we handle it. 
        // Let's assume we keep genesis.
        
        for h in 1..target_height {
            let height_key = format!("height:{}", h);
            
            if let Some(hash_bytes) = self.db.remove(height_key.as_bytes()).map_err(|e| e.to_string())? {
                let hash = String::from_utf8(hash_bytes.to_vec())
                    .map_err(|e| format!("Failed to decode hash: {}", e))?;
                
                // Do not delete if it happens to be the current head (unlikely given target_height < current)
                if hash == chain_head_hash {
                    continue;
                }
                
                // Delete the actual block data
                self.delete_block(&hash)?;
                deleted_count += 1;
            }
        }
        
        Ok(deleted_count)
    }

    /// Store a seen block header (for slashing detection)
    /// Key: "header:slot:pubkey" -> block_hash
    pub fn store_seen_header(&self, slot: u64, pubkey: &[u8], block_hash: &str) -> Result<(), String> {
        let key = format!("header:{}:{}", slot, hex::encode(pubkey));
        self.db
            .insert(key.as_bytes(), block_hash.as_bytes())
            .map_err(|e| format!("Failed to store seen header: {}", e))?;
        Ok(())
    }

    /// Get a seen block header
    pub fn get_seen_header(&self, slot: u64, pubkey: &[u8]) -> Result<Option<String>, String> {
        let key = format!("header:{}:{}", slot, hex::encode(pubkey));
        let value = self.db.get(key.as_bytes())
            .map_err(|e| format!("Failed to get seen header: {}", e))?;
            
        Ok(value.map(|v| String::from_utf8_lossy(&v).to_string()))
    }

    /// Store a vote
    /// Key: "vote:block_hash:pubkey" -> serialized vote
    pub fn store_vote(&self, vote: &Vote) -> Result<(), String> {
        let key = format!("vote:{}:{}", vote.block_hash, hex::encode(&vote.validator_pubkey));
        let value = bincode::serialize(vote)
            .map_err(|e| format!("Failed to serialize vote: {}", e))?;
            
        self.db.insert(key.as_bytes(), value)
            .map_err(|e| format!("Failed to store vote: {}", e))?;
        Ok(())
    }

    /// Get all votes for a block
    pub fn get_votes(&self, block_hash: &str) -> Result<Vec<Vote>, String> {
        let prefix = format!("vote:{}", block_hash);
        let mut votes = Vec::new();

        for item in self.db.scan_prefix(prefix.as_bytes()) {
             let (_, value) = item.map_err(|e| format!("Failed to scan votes: {}", e))?;
             let vote: Vote = bincode::deserialize(&value)
                .map_err(|e| format!("Failed to deserialize vote: {}", e))?;
             votes.push(vote);
        }
        
        Ok(votes)
    }

    // Faucet claim tracking methods
    
    /// Record a faucet claim for an address
    /// Key: "faucet:address" -> timestamp (i64)
    pub fn record_faucet_claim(&self, address: &[u8], timestamp: i64) -> Result<(), String> {
        let key = [b"faucet:", address].concat();
        let value = timestamp.to_le_bytes();
        
        self.db.insert(&key, value.as_ref())
            .map_err(|e| format!("Failed to record faucet claim: {}", e))?;
        Ok(())
    }
    
    /// Get the last claim timestamp for an address
    pub fn get_last_claim(&self, address: &[u8]) -> Result<Option<i64>, String> {
        let key = [b"faucet:", address].concat();
        let value = self.db.get(&key)
            .map_err(|e| format!("Failed to get last claim: {}", e))?;
        
        match value {
            Some(bytes) => {
                if bytes.len() == 8 {
                    let mut arr = [0u8; 8];
                    arr.copy_from_slice(&bytes);
                    Ok(Some(i64::from_le_bytes(arr)))
                } else {
                    Err("Invalid timestamp format".to_string())
                }
            }
            None => Ok(None),
        }
    }
    
    /// Check if an address can claim from the faucet (24-hour cooldown)
    pub fn can_claim(&self, address: &[u8], current_time: i64) -> Result<bool, String> {
        match self.get_last_claim(address)? {
            Some(last_claim) => {
                const COOLDOWN_MS: i64 = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                Ok(current_time - last_claim >= COOLDOWN_MS)
            }
            None => Ok(true), // Never claimed before
        }
    }
    
    /// Get time remaining until next claim (in milliseconds)
    pub fn get_claim_cooldown_remaining(&self, address: &[u8], current_time: i64) -> Result<Option<i64>, String> {
        match self.get_last_claim(address)? {
            Some(last_claim) => {
                const COOLDOWN_MS: i64 = 24 * 60 * 60 * 1000;
                let elapsed = current_time - last_claim;
                if elapsed < COOLDOWN_MS {
                    Ok(Some(COOLDOWN_MS - elapsed))
                } else {
                    Ok(None)
                }
            }
            None => Ok(None),
        }
    }

    /// Store transaction index: tx_hash -> block_hash
    /// Key: "tx_index:tx_hash_hex" -> block_hash_hex
    pub fn store_transaction_index(&self, tx_hash: &str, block_hash: &str) -> Result<(), String> {
        let key = format!("tx_index:{}", tx_hash);
        self.db
            .insert(key.as_bytes(), block_hash.as_bytes())
            .map_err(|e| format!("Failed to store transaction index: {}", e))?;
        Ok(())
    }

    /// Get block hash for a transaction
    pub fn get_transaction_block(&self, tx_hash: &str) -> Result<Option<String>, String> {
        let key = format!("tx_index:{}", tx_hash);
        let value = self.db
            .get(key.as_bytes())
            .map_err(|e| format!("Failed to get transaction index: {}", e))?;
            
        Ok(value.map(|v| String::from_utf8_lossy(&v).to_string()))
    }

    // Address History Indexing
    
    /// Add a transaction to an address's history
    /// Uses 2 keys:
    /// count: "history_count:address" -> u64 (total count)
    /// item: "history:address:index" -> tx_hash
    pub fn add_transaction_to_address(&self, address: &str, tx_hash: &str) -> Result<(), String> {
        let count_key = format!("history_count:{}", address);
        
        // 1. Get current count (or 0)
        let count: u64 = match self.db.get(count_key.as_bytes()) {
             Ok(Some(bytes)) => {
                 let mut arr = [0u8; 8];
                 arr.copy_from_slice(&bytes);
                 u64::from_le_bytes(arr)
             },
             Ok(None) => 0,
             Err(e) => return Err(format!("Failed to get history count: {}", e)),
        };
        
        // 2. Store item at current count
        let item_key = format!("history:{}:{}", address, count);
        self.db.insert(item_key.as_bytes(), tx_hash.as_bytes())
            .map_err(|e| format!("Failed to store history item: {}", e))?;
            
        // 3. Increment count
        self.db.insert(count_key.as_bytes(), (count + 1).to_le_bytes().as_ref())
            .map_err(|e| format!("Failed to update history count: {}", e))?;
            
        Ok(())
    }
    
    /// Get transaction history for an address (most recent first)
    pub fn get_address_history(&self, address: &str, limit: usize) -> Result<Vec<String>, String> {
        let count_key = format!("history_count:{}", address);
        
        let count: u64 = match self.db.get(count_key.as_bytes()) {
             Ok(Some(bytes)) => {
                 let mut arr = [0u8; 8];
                 arr.copy_from_slice(&bytes);
                 u64::from_le_bytes(arr)
             },
             _ => return Ok(Vec::new()), // No history
        };
        
        let mut history = Vec::new();
        let start_index = if count > 0 { count - 1 } else { return Ok(Vec::new()) };
        let end_index = if count > limit as u64 { count - limit as u64 } else { 0 };
        
        // Loop backwards from latest
        for i in (end_index..=start_index).rev() {
            let item_key = format!("history:{}:{}", address, i);
            if let Ok(Some(bytes)) = self.db.get(item_key.as_bytes()) {
                let tx_hash = String::from_utf8(bytes.to_vec())
                    .map_err(|e| format!("Failed to decode tx hash: {}", e))?;
                history.push(tx_hash);
            }
        }
        
        Ok(history)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::block::{Block, BlockHeader};
    use tempfile::TempDir;

    #[test]
    fn test_store_and_retrieve_block() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        
        let header = BlockHeader {
            parent_hash: "0".to_string(),
            slot: 0,
            epoch: 0,
            vrf_output: vec![1, 2, 3],
            vrf_proof: vec![4, 5, 6],
            validator_pubkey: vec![7, 8, 9],
            producer_signature: vec![],
            state_root: "".to_string(),
            tx_root: "".to_string(),
            extra_witnesses: vec![],
            timestamp: 0,
        };
        
        let block = Block::new(header, vec![]);
        let hash = block.hash.clone();
        
        storage.store_block(&block).unwrap();
        let retrieved = storage.get_block(&hash).unwrap();
        
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().hash, hash);
    }

    #[test]
    fn test_store_and_retrieve_head() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        
        let hash = "test_hash";
        storage.store_head(hash).unwrap();
        
        let retrieved = storage.get_head().unwrap();
        assert_eq!(retrieved, Some(hash.to_string()));
    }

    #[test]
    fn test_store_and_retrieve_account() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        
        let address = vec![1, 2, 3];
        let account = Account::new(1000);
        
        storage.store_account(&address, &account).unwrap();
        let retrieved = storage.get_account(&address).unwrap();
        
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().balance, 1000);
    }

    #[test]
    fn test_store_and_retrieve_block_by_height() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        
        let height = 100;
        let hash = "block_hash_100";
        
        storage.store_block_by_height(height, hash).unwrap();
        let retrieved = storage.get_block_by_height(height).unwrap();
        
        assert_eq!(retrieved, Some(hash.to_string()));
    }

    #[test]
    fn test_faucet_claim_tracking() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        
        let address = vec![1, 2, 3, 4];
        let timestamp = 1000000;
        
        // Record claim
        storage.record_faucet_claim(&address, timestamp).unwrap();
        
        // Retrieve claim
        let last_claim = storage.get_last_claim(&address).unwrap();
        assert_eq!(last_claim, Some(timestamp));
    }

    #[test]
    fn test_faucet_rate_limiting() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        
        let address = vec![5, 6, 7, 8];
        let first_claim_time = 1000000;
        
        // First claim should be allowed
        assert!(storage.can_claim(&address, first_claim_time).unwrap());
        
        // Record the claim
        storage.record_faucet_claim(&address, first_claim_time).unwrap();
        
        // Immediate second claim should be denied
        assert!(!storage.can_claim(&address, first_claim_time + 1000).unwrap());
        
        // Claim after 24 hours should be allowed
        const DAY_MS: i64 = 24 * 60 * 60 * 1000;
        assert!(storage.can_claim(&address, first_claim_time + DAY_MS).unwrap());
    }

    #[test]
    fn test_faucet_cooldown_remaining() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        
        let address = vec![9, 10, 11, 12];
        let claim_time = 1000000;
        
        // No claim yet
        assert_eq!(storage.get_claim_cooldown_remaining(&address, claim_time).unwrap(), None);
        
        // Record claim
        storage.record_faucet_claim(&address, claim_time).unwrap();
        
        // Check cooldown 1 hour later
        const HOUR_MS: i64 = 60 * 60 * 1000;
        let one_hour_later = claim_time + HOUR_MS;
        let remaining = storage.get_claim_cooldown_remaining(&address, one_hour_later).unwrap();
        assert!(remaining.is_some());
        assert_eq!(remaining.unwrap(), 23 * HOUR_MS); // 23 hours remaining
        
        // Check after 24 hours
        const DAY_MS: i64 = 24 * 60 * 60 * 1000;
        let after_cooldown = claim_time + DAY_MS;
        assert_eq!(storage.get_claim_cooldown_remaining(&address, after_cooldown).unwrap(), None);
    }
}
