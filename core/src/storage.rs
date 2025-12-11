use crate::block::Block;
use crate::state::Account;
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
}
