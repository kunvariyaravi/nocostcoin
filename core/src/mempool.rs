use std::collections::HashMap;
use crate::transaction::Transaction;
use crate::state::State;

/// Transaction Mempool to store unconfirmed transactions
#[derive(Debug, Clone)]
pub struct Mempool {
    pub transactions: HashMap<Vec<u8>, Transaction>, // Hash -> Transaction
    capacity: usize,
}

impl Mempool {
    /// Create a new Mempool with a given capacity
    pub fn new(capacity: usize) -> Self {
        Self {
            transactions: HashMap::new(),
            capacity,
        }
    }

    /// Add a transaction to the mempool
    pub fn add_transaction(&mut self, tx: Transaction, state: &State) -> Result<(), String> {
        // 1. Check capacity
        if self.transactions.len() >= self.capacity {
            return Err("Mempool is full".to_string());
        }

        // 2. Basic Validation (Signature)
        tx.validate()?;

        // 3. Check Balance (based on transaction type)
        match &tx.data {
            crate::transaction::TransactionData::NativeTransfer { amount } => {
                let balance = state.get_balance(&tx.sender);
                if balance < *amount {
                    return Err(format!("Insufficient balance. Available: {}, Required: {}", balance, amount));
                }
            },
            crate::transaction::TransactionData::TransferAsset { asset_id, amount } => {
                 // Check asset balance
                 let account = state.get_account(&tx.sender).ok_or("Sender account not found")?;
                 let balance = account.assets.get(asset_id).cloned().unwrap_or(0);
                 if balance < *amount {
                      return Err(format!("Insufficient asset balance. Available: {}, Required: {}", balance, amount));
                 }
            },
            crate::transaction::TransactionData::CreateAsset { .. } => {
                // Creation might have a fee in the future
            },
            crate::transaction::TransactionData::OpenChannel { amount, .. } => {
                let balance = state.get_balance(&tx.sender);
                if balance < *amount {
                    return Err(format!("Insufficient balance for channel deposit. Available: {}, Required: {}", balance, amount));
                }
            },
            crate::transaction::TransactionData::CloseChannel { channel_id, .. } => {
                 if !state.channels.contains_key(channel_id) {
                     return Err("Channel does not exist".to_string());
                 }
            },
             crate::transaction::TransactionData::DelegateSpend { .. } => {
                 // Nothing to check against state for setting up delegate
            },
            _ => {
                // Other types logic
            }
        }

        // 4. Check Nonce
        // For now, we just check if nonce is >= state nonce.
        // A more advanced implementation would track pending nonces.
        let state_nonce = state.get_nonce(&tx.sender);
        if tx.nonce < state_nonce {
            return Err(format!("Invalid nonce. State nonce: {}, Tx nonce: {}", state_nonce, tx.nonce));
        }

        // 5. Add to pool
        // We use the signature as a unique ID for now, or we could hash the tx.
        // Since Transaction doesn't have a hash field, we can use the signature bytes.
        self.transactions.insert(tx.signature.clone(), tx);
        
        Ok(())
    }

    /// Get transactions to include in a block
    /// Returns a list of transactions ordered by nonce for each sender
    pub fn get_transactions_for_block(&self, limit: usize) -> Vec<Transaction> {
        let mut txs: Vec<Transaction> = self.transactions.values().cloned().collect();
        
        // Simple ordering: just take the first 'limit' transactions
        // In a real system, we'd order by fee, then nonce.
        // Here we just sort by nonce to ensure we don't include out-of-order txs if possible
        txs.sort_by_key(|tx| tx.nonce);
        
        txs.into_iter().take(limit).collect()
    }

    /// Remove transactions that have been included in a block
    pub fn remove_transactions(&mut self, txs: &[Transaction]) {
        for tx in txs {
            self.transactions.remove(&tx.signature);
        }
    }

    /// Get current size of mempool
    pub fn len(&self) -> usize {
        self.transactions.len()
    }

    /// Get all transactions in the mempool
    pub fn get_all(&self) -> Vec<Transaction> {
        self.transactions.values().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::Crypto;
    use crate::storage::Storage;
    use tempfile::TempDir;

    #[test]
    fn test_add_transaction() {
        let mut mempool = Mempool::new(10);
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        let mut state = State::new(storage);
        
        let sender_keypair = Crypto::generate_keypair();
        let receiver_keypair = Crypto::generate_keypair();
        
        let sender_addr = sender_keypair.public.to_bytes().to_vec();
        let receiver_addr = receiver_keypair.public.to_bytes().to_vec();
        
        // Fund sender
        state.set_balance(sender_addr.clone(), 100);
        
        // Create valid tx
        let tx = Transaction::new(
            sender_addr.clone(),
            receiver_addr.clone(),
            crate::transaction::TransactionData::NativeTransfer { amount: 50 },
            0,
            &sender_keypair
        );
        
        assert!(mempool.add_transaction(tx.clone(), &state).is_ok());
        assert_eq!(mempool.len(), 1);
    }
}
