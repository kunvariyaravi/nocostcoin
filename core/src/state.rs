use serde::{Deserialize, Serialize};
use crate::storage::Storage;
use crate::trie::MerklePatriciaTrie;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Account {
    pub balance: u64,
    pub nonce: u64,
}

impl Account {
    pub fn new(balance: u64) -> Self {
        Self { balance, nonce: 0 }
    }
}

use std::collections::HashMap;

#[derive(Clone)]
pub struct State {
    storage: Storage,
    pending_changes: HashMap<Vec<u8>, Account>,
    trie: MerklePatriciaTrie,
}

impl State {
    pub fn new(storage: Storage) -> Self {
        let mut trie = MerklePatriciaTrie::new();
        
        // Rebuild trie from existing accounts in database
        if let Ok(accounts) = storage.get_all_accounts() {
            for (address, account) in accounts {
                if let Ok(account_data) = bincode::serialize(&account) {
                    trie.insert(address, account_data);
                }
            }
        }
        
        Self { 
            storage,
            pending_changes: HashMap::new(),
            trie,
        }
    }

    pub fn get_account(&self, address: &[u8]) -> Option<Account> {
        if let Some(acc) = self.pending_changes.get(address) {
            return Some(acc.clone());
        }
        self.storage.get_account(address).unwrap_or(None)
    }

    pub fn get_balance(&self, address: &[u8]) -> u64 {
        self.get_account(address)
            .map(|acc| acc.balance)
            .unwrap_or(0)
    }

    pub fn get_nonce(&self, address: &[u8]) -> u64 {
        self.get_account(address)
            .map(|acc| acc.nonce)
            .unwrap_or(0)
    }

    pub fn set_balance(&mut self, address: Vec<u8>, balance: u64) {
        let mut account = self.get_account(&address).unwrap_or(Account::new(0));
        account.balance = balance;
        self.pending_changes.insert(address, account);
    }

    pub fn transfer(&mut self, from: &[u8], to: Vec<u8>, amount: u64) -> Result<(), String> {
        let mut from_account = self.get_account(from).ok_or("Sender account not found")?;
        
        if from_account.balance < amount {
            return Err("Insufficient balance".to_string());
        }

        // Deduct from sender
        from_account.balance -= amount;
        from_account.nonce += 1;
        self.pending_changes.insert(from.to_vec(), from_account);

        // Add to receiver
        let mut to_account = self.get_account(&to).unwrap_or(Account::new(0));
        to_account.balance += amount;
        self.pending_changes.insert(to, to_account);

        Ok(())
    }

    #[allow(dead_code)]
    pub fn increment_nonce(&mut self, address: &[u8]) {
        let mut account = self.get_account(address).unwrap_or(Account::new(0));
        account.nonce += 1;
        self.pending_changes.insert(address.to_vec(), account);
    }

    // New atomic methods
    pub fn apply_changes(&mut self) -> Result<(), String> {
        for (address, account) in &self.pending_changes {
            self.storage.store_account(address, account)
                .map_err(|e| format!("Failed to store account: {}", e))?;
            
            // Update trie with account data
            let account_data = bincode::serialize(account)
                .map_err(|e| format!("Failed to serialize account: {}", e))?;
            self.trie.insert(address.clone(), account_data);
        }
        self.pending_changes.clear();
        Ok(())
    }

    pub fn discard_changes(&mut self) {
        self.pending_changes.clear();
    }

    /// Get the current state root hash
    pub fn get_root_hash(&self) -> String {
        self.trie.root()
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_test_state() -> (State, TempDir) {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        (State::new(storage), temp_dir)
    }

    #[test]
    fn test_account_creation() {
        let (mut state, _temp) = create_test_state();
        let addr = vec![1, 2, 3];
        state.set_balance(addr.clone(), 100);
        assert_eq!(state.get_balance(&addr), 100);
        assert_eq!(state.get_nonce(&addr), 0);
    }

    #[test]
    fn test_transfer() {
        let (mut state, _temp) = create_test_state();
        let from = vec![1, 2, 3];
        let to = vec![4, 5, 6];
        
        state.set_balance(from.clone(), 100);
        
        let result = state.transfer(&from, to.clone(), 30);
        assert!(result.is_ok());
        assert_eq!(state.get_balance(&from), 70);
        assert_eq!(state.get_balance(&to), 30);
        assert_eq!(state.get_nonce(&from), 1);
    }

    #[test]
    fn test_insufficient_balance() {
        let (mut state, _temp) = create_test_state();
        let from = vec![1, 2, 3];
        let to = vec![4, 5, 6];
        
        state.set_balance(from.clone(), 10);
        
        let result = state.transfer(&from, to, 30);
        assert!(result.is_err());
    }
}
