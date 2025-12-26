use serde::{Deserialize, Serialize};
use crate::storage::Storage;
use crate::trie::MerklePatriciaTrie;
use crate::transaction::{Transaction, TransactionData};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Account {
    pub balance: u64,
    pub nonce: u64,
    pub assets: HashMap<Vec<u8>, u64>, // AssetID -> Balance
    pub nfts: HashMap<Vec<u8>, Vec<u64>>, // CollectionID -> Wrapped Item IDs
    
    // Delegate -> Remaining Allowance
    pub delegated_allowance: HashMap<Vec<u8>, u64>,
}

impl Account {
    pub fn new(balance: u64) -> Self {
        Self { 
            balance, 
            nonce: 0,
            assets: HashMap::new(),
            nfts: HashMap::new(),
            delegated_allowance: HashMap::new(),
        }
    }
}

// Global Registry structs (could also be stored in a separate trie, but simplifying for now)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Asset {
    pub id: Vec<u8>,
    pub issuer: Vec<u8>,
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
    pub decimals: u8,
    pub metadata: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Collection {
    pub id: Vec<u8>,
    pub issuer: Vec<u8>,
    pub name: String,
    pub symbol: String,
    pub metadata: Vec<u8>,
    pub items: HashMap<u64, NFTItem>, // ItemID -> Item Data
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NFTItem {
    pub id: u64,
    pub owner: Vec<u8>,
    pub metadata: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PaymentChannel {
    pub id: Vec<u8>,
    pub partner_a: Vec<u8>, // Opener
    pub partner_b: Vec<u8>, // Recipient
    pub total_deposit: u64,
    pub expiry: u64, // Slot number
    pub is_closed: bool,
}



#[derive(Clone)]
pub struct State {
    storage: Storage,
    pub pending_changes: HashMap<Vec<u8>, Account>,
    trie: MerklePatriciaTrie,
    
    // In-memory cache for assets/collections (in a real system, these would also be in Storage/Trie)
    pub assets: HashMap<Vec<u8>, Asset>,
    pub collections: HashMap<Vec<u8>, Collection>,
    pub channels: HashMap<Vec<u8>, PaymentChannel>,
}

impl State {
    pub fn new(storage: Storage) -> Self {
        let mut trie = MerklePatriciaTrie::new();
        
        // Rebuild trie from existing accounts
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
            assets: HashMap::new(),
            collections: HashMap::new(),
            channels: HashMap::new(),
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

    // Generic apply transaction
    pub fn apply_transaction(&mut self, tx: &Transaction) -> Result<(), String> {
        // 1. Check Nonce
        let nonce = self.get_nonce(&tx.sender);
        if tx.nonce != nonce {
             return Err(format!("Invalid nonce. Expected {}, got {}", nonce, tx.nonce));
        }

        // 2. Process Data
        match &tx.data {
            TransactionData::NativeTransfer { amount } => {
                self.transfer_native(&tx.sender, &tx.receiver, *amount)?;
            },
            TransactionData::CreateAsset { name, symbol, supply, decimals, metadata } => {
                self.create_asset(&tx.sender, tx, name, symbol, *supply, *decimals, metadata)?;
            },
            TransactionData::TransferAsset { asset_id, amount } => {
                self.transfer_asset(&tx.sender, &tx.receiver, asset_id, *amount)?;
            },
            TransactionData::CreateCollection { name, symbol, metadata } => {
                self.create_collection(&tx.sender, tx, name, symbol, metadata)?;
            },
            TransactionData::MintNFT { collection_id, item_id, item_metadata, recipient } => {
                self.mint_nft(&tx.sender, collection_id, *item_id, item_metadata, recipient)?;
            },
            TransactionData::TransferNFT { collection_id, item_id } => {
                self.transfer_nft(&tx.sender, &tx.receiver, collection_id, *item_id)?;
            },
            TransactionData::OpenChannel { partner, amount, duration } => {
                self.open_channel(&tx.sender, partner, *amount, *duration, tx)?;
            },
            TransactionData::CloseChannel { channel_id, balance_proof: _, final_balance_a, final_balance_b } => {
                 self.close_channel(&tx.sender, channel_id, *final_balance_a, *final_balance_b)?;
            },
            TransactionData::DelegateSpend { delegate, allowance, expiry: _ } => {
                self.delegate_spend(&tx.sender, delegate, *allowance)?;
            },
            TransactionData::RegisterValidator { stake } => {
                // Deduct stake from balance
                let mut account = self.get_account(&tx.sender).ok_or("Account not found")?;
                if account.balance < *stake {
                    return Err("Insufficient balance for stake".to_string());
                }
                account.balance -= stake;
                self.pending_changes.insert(tx.sender.clone(), account);
            },
            TransactionData::UnregisterValidator => {
                // Refund is handled by Chain/ValidatorSet interaction since State doesn't know staked amount.
                // Here we just validate account existence
                if self.get_account(&tx.sender).is_none() {
                    return Err("Account not found".to_string());
                }
            },
        }

        // 3. Increment Nonce
        self.increment_nonce(&tx.sender);

        Ok(())
    }

    fn transfer_native(&mut self, from: &[u8], to: &[u8], amount: u64) -> Result<(), String> {
        // Reject self-transfers - sending to yourself is not allowed
        if from == to {
            return Err("Cannot send tokens to yourself".to_string());
        }

        let mut from_account = self.get_account(from).ok_or("Sender account not found")?;
        
        if from_account.balance < amount {
            return Err("Insufficient native balance".to_string());
        }

        from_account.balance -= amount;
        self.pending_changes.insert(from.to_vec(), from_account);

        let mut to_account = self.get_account(to).unwrap_or(Account::new(0));
        to_account.balance += amount;
        self.pending_changes.insert(to.to_vec(), to_account);

        Ok(())
    }

    fn create_asset(&mut self, issuer: &[u8], tx: &Transaction, name: &str, symbol: &str, supply: u64, decimals: u8, metadata: &[u8]) -> Result<(), String> {
        // Calculate ID
        let asset_id = tx.calculate_asset_id().ok_or("Failed to calculate asset ID")?;

        if self.assets.contains_key(&asset_id) {
            return Err("Asset already exists".to_string());
        }

        let asset = Asset {
            id: asset_id.clone(),
            issuer: issuer.to_vec(),
            name: name.to_string(),
            symbol: symbol.to_string(),
            total_supply: supply,
            decimals,
            metadata: metadata.to_vec(),
        };

        // Give initial supply to issuer
        let mut issuer_account = self.get_account(issuer).unwrap_or(Account::new(0));
        issuer_account.assets.insert(asset_id.clone(), supply);
        
        self.pending_changes.insert(issuer.to_vec(), issuer_account);
        self.assets.insert(asset_id, asset);

        Ok(())
    }

    fn transfer_asset(&mut self, from: &[u8], to: &[u8], asset_id: &[u8], amount: u64) -> Result<(), String> {
        if !self.assets.contains_key(asset_id) {
            return Err("Asset does not exist".to_string());
        }

        let mut from_account = self.get_account(from).ok_or("Sender account not found")?;
        
        let balance = from_account.assets.get(asset_id).cloned().unwrap_or(0);
        if balance < amount {
            return Err("Insufficient asset balance".to_string());
        }

        from_account.assets.insert(asset_id.to_vec(), balance - amount);
        self.pending_changes.insert(from.to_vec(), from_account);

        let mut to_account = self.get_account(to).unwrap_or(Account::new(0));
        let to_balance = to_account.assets.get(asset_id).cloned().unwrap_or(0);
        to_account.assets.insert(asset_id.to_vec(), to_balance + amount);
        self.pending_changes.insert(to.to_vec(), to_account);

        Ok(())
    }

    fn create_collection(&mut self, issuer: &[u8], tx: &Transaction, name: &str, symbol: &str, metadata: &[u8]) -> Result<(), String> {
        let collection_id = tx.calculate_asset_id().ok_or("Failed to calc ID")?;

        if self.collections.contains_key(&collection_id) {
            return Err("Collection already exists".to_string());
        }

        let collection = Collection {
            id: collection_id.clone(),
            issuer: issuer.to_vec(),
            name: name.to_string(),
            symbol: symbol.to_string(),
            metadata: metadata.to_vec(),
            items: HashMap::new(),
        };

        self.collections.insert(collection_id, collection);
        Ok(())
    }

    fn mint_nft(&mut self, sender: &[u8], collection_id: &[u8], item_id: u64, item_metadata: &[u8], recipient: &[u8]) -> Result<(), String> {
        let collection = self.collections.get_mut(collection_id).ok_or("Collection not found")?;
        
        if collection.issuer != sender {
            return Err("Only issuer can mint".to_string());
        }

        if collection.items.contains_key(&item_id) {
            return Err("Item ID already exists".to_string());
        }

        let item = NFTItem {
            id: item_id,
            owner: recipient.to_vec(),
            metadata: item_metadata.to_vec(),
        };

        collection.items.insert(item_id, item);

        // Add to recipient's account
        let mut recipient_account = self.get_account(recipient).unwrap_or(Account::new(0));
        let my_nfts = recipient_account.nfts.entry(collection_id.to_vec()).or_insert(Vec::new());
        my_nfts.push(item_id);
        
        self.pending_changes.insert(recipient.to_vec(), recipient_account);

        Ok(())
    }

    fn transfer_nft(&mut self, from: &[u8], to: &[u8], collection_id: &[u8], item_id: u64) -> Result<(), String> {
        let collection = self.collections.get_mut(collection_id).ok_or("Collection not found")?;
        let item = collection.items.get_mut(&item_id).ok_or("Item not found")?;

        if item.owner != from {
            return Err("Sender does not own this NFT".to_string());
        }

        // Update item owner
        item.owner = to.to_vec();

        // Remove from sender
        let mut from_account = self.get_account(from).ok_or("Sender account not found")?;
        if let Some(nfts) = from_account.nfts.get_mut(collection_id) {
            nfts.retain(|&x| x != item_id);
        }
        self.pending_changes.insert(from.to_vec(), from_account);

        // Add to receiver
        let mut to_account = self.get_account(to).unwrap_or(Account::new(0));
        let dest_nfts = to_account.nfts.entry(collection_id.to_vec()).or_insert(Vec::new());
        dest_nfts.push(item_id);
        self.pending_changes.insert(to.to_vec(), to_account);

        Ok(())
    }

    fn open_channel(&mut self, sender: &[u8], partner: &[u8], amount: u64, duration: u64, tx: &Transaction) -> Result<(), String> {
        let mut sender_account = self.get_account(sender).ok_or("Sender account not found")?;
        
        if sender_account.balance < amount {
            return Err("Insufficient balance for channel deposit".to_string());
        }

        // Deduct deposit
        sender_account.balance -= amount;
        self.pending_changes.insert(sender.to_vec(), sender_account);

        let channel_id = tx.calculate_asset_id().ok_or("Failed to calc Channel ID")?;
        
        if self.channels.contains_key(&channel_id) {
            return Err("Channel ID collision".to_string());
        }

        let channel = PaymentChannel {
            id: channel_id.clone(),
            partner_a: sender.to_vec(),
            partner_b: partner.to_vec(),
            total_deposit: amount,
            expiry: duration, 
            is_closed: false,
        };

        self.channels.insert(channel_id, channel);
        Ok(())
    }

    fn close_channel(&mut self, sender: &[u8], channel_id: &[u8], final_balance_a: u64, final_balance_b: u64) -> Result<(), String> {
        // Scope to hold the mutable borrow of channel
        let (partner_a, partner_b, total_deposit) = {
             let channel = self.channels.get_mut(channel_id).ok_or("Channel not found")?;
             
             if channel.is_closed {
                 return Err("Channel already closed".to_string());
             }
             
             // Authorization check: either partner can close (if they provide proof)
             if sender != channel.partner_a && sender != channel.partner_b {
                  return Err("Not authorized to close channel".to_string());
             }
             
             channel.is_closed = true;
             
             (channel.partner_a.clone(), channel.partner_b.clone(), channel.total_deposit)
        }; // Borrow ends here

        // Validate balances match deposit
        if final_balance_a + final_balance_b != total_deposit {
            return Err("Balance mismatch: total does not match deposit".to_string());
        }

        // Payout A
        let mut account_a = self.get_account(&partner_a).unwrap_or(Account::new(0));
        account_a.balance += final_balance_a;
        self.pending_changes.insert(partner_a, account_a);

        // Payout B
        let mut account_b = self.get_account(&partner_b).unwrap_or(Account::new(0));
        account_b.balance += final_balance_b;
        self.pending_changes.insert(partner_b, account_b);

        Ok(())
    }

    fn delegate_spend(&mut self, owner: &[u8], delegate: &[u8], allowance: u64) -> Result<(), String> {
        let mut owner_account = self.get_account(owner).unwrap_or(Account::new(0)); 
        
        // Set allowance
        owner_account.delegated_allowance.insert(delegate.to_vec(), allowance);
        
        self.pending_changes.insert(owner.to_vec(), owner_account);
        Ok(())
    }



    pub fn increment_nonce(&mut self, address: &[u8]) {
        let mut account = self.get_account(address).unwrap_or(Account::new(0));
        account.nonce += 1;
        self.pending_changes.insert(address.to_vec(), account);
    }

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
    use crate::crypto::Crypto;

    fn create_test_state() -> (State, TempDir) {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        (State::new(storage), temp_dir)
    }

    #[test]
    fn test_asset_creation_and_transfer() {
        let (mut state, _temp) = create_test_state();
        let keypair = Crypto::generate_keypair();
        let sender = keypair.public.to_bytes().to_vec();
        let receiver = vec![4, 5, 6];

        // 1. Create Asset
        let create_tx = Transaction::new(
            sender.clone(),
            vec![],
            TransactionData::CreateAsset {
                name: "TestCoin".into(),
                symbol: "TST".into(),
                supply: 1000,
                decimals: 8,
                metadata: vec![],
            },
            0,
            &keypair,
        );

        assert!(state.apply_transaction(&create_tx).is_ok());

        let asset_id = create_tx.calculate_asset_id().unwrap();
        let sender_acc = state.get_account(&sender).unwrap();
        assert_eq!(*sender_acc.assets.get(&asset_id).unwrap(), 1000);

        // 2. Transfer Asset
        let transfer_tx = Transaction::new(
            sender.clone(),
            receiver.clone(),
            TransactionData::TransferAsset {
                asset_id: asset_id.clone(),
                amount: 100,
            },
            1, // Nonce incremented
            &keypair,
        );

        assert!(state.apply_transaction(&transfer_tx).is_ok());

        let sender_acc = state.get_account(&sender).unwrap();
        let receiver_acc = state.get_account(&receiver).unwrap();

        assert_eq!(*sender_acc.assets.get(&asset_id).unwrap(), 900);
        assert_eq!(*receiver_acc.assets.get(&asset_id).unwrap(), 100);
    }
    #[test]
    fn test_channel_lifecycle() {
        let (mut state, _temp) = create_test_state();

        let sender_pair = Crypto::generate_keypair();
        let sender = sender_pair.public.to_bytes().to_vec();
        
        let partner_pair = Crypto::generate_keypair();
        let partner = partner_pair.public.to_bytes().to_vec();

        state.set_balance(sender.clone(), 1000);

        // 1. Open Channel
        let open_data = TransactionData::OpenChannel {
            partner: partner.clone(),
            amount: 500,
            duration: 100,
        };
        let open_tx = Transaction::new(sender.clone(), vec![], open_data.clone(), 0, &sender_pair);
        
        state.apply_transaction(&open_tx).expect("Failed to open channel");

        // Verify balance deducted
        assert_eq!(state.get_balance(&sender), 500);
        
        // Verify channel exists
        let channel_id = open_tx.calculate_asset_id().unwrap();
        assert!(state.channels.contains_key(&channel_id));

        // 2. Close Channel
        let close_data = TransactionData::CloseChannel {
            channel_id: channel_id.clone(),
            balance_proof: vec![],
            final_balance_a: 300, // Sender gets 300 back
            final_balance_b: 200, // Partner gets 200
        };
        // Partner signs the close (or sender can if authorized, for now simplistic)
        // Let's have sender close it due to simplified check
        let close_tx = Transaction::new(sender.clone(), vec![], close_data, 1, &sender_pair);

        state.apply_transaction(&close_tx).expect("Failed to close channel");

        // Verify balances
        assert_eq!(state.get_balance(&sender), 800); // 500 (remaining) + 300 (channel)
        assert_eq!(state.get_balance(&partner), 200); // 0 + 200 (channel)
        
        // Verify closed
        assert!(state.channels.get(&channel_id).unwrap().is_closed);
    }

    #[test]
    fn test_delegation() {
        let (mut state, _temp) = create_test_state();

        let owner_pair = Crypto::generate_keypair();
        let owner = owner_pair.public.to_bytes().to_vec();
        
        let delegate_pair = Crypto::generate_keypair();
        let delegate = delegate_pair.public.to_bytes().to_vec();

        state.set_balance(owner.clone(), 100);

        // 1. Set Delegate Allowance
        let delegate_data = TransactionData::DelegateSpend {
            delegate: delegate.clone(),
            allowance: 50,
            expiry: 1000,
        };
        let tx = Transaction::new(owner.clone(), vec![], delegate_data, 0, &owner_pair);
        
        state.apply_transaction(&tx).expect("Failed to set delegate");

        let account = state.get_account(&owner).unwrap();
        assert_eq!(*account.delegated_allowance.get(&delegate).unwrap(), 50);
    }

    #[test]
    fn test_insufficient_asset_balance() {
        let (mut state, _temp) = create_test_state();
        let keypair = Crypto::generate_keypair();
        let sender = keypair.public.to_bytes().to_vec();
        let receiver = vec![1, 2, 3];

        // Create asset
        let create_tx = Transaction::new(
            sender.clone(),
            vec![],
            TransactionData::CreateAsset {
                name: "Token".into(),
                symbol: "TKN".into(),
                supply: 100,
                decimals: 0,
                metadata: vec![],
            },
            0,
            &keypair,
        );
        state.apply_transaction(&create_tx).unwrap();
        let asset_id = create_tx.calculate_asset_id().unwrap();

        // Try transfer more than balance
        let transfer_tx = Transaction::new(
            sender.clone(),
            receiver.clone(),
            TransactionData::TransferAsset {
                asset_id: asset_id,
                amount: 101, // > 100
            },
            1,
            &keypair,
        );

        let result = state.apply_transaction(&transfer_tx);
        assert!(result.is_err());
        assert_eq!(result.err().unwrap(), "Insufficient asset balance");
    }

    #[test]
    fn test_mint_nft_not_owner() {
        let (mut state, _temp) = create_test_state();
        let owner_pair = Crypto::generate_keypair();
        let owner = owner_pair.public.to_bytes().to_vec();
        
        let attacker_pair = Crypto::generate_keypair();
        let attacker = attacker_pair.public.to_bytes().to_vec();

        // Owner creates collection
        let create_tx = Transaction::new(
            owner.clone(),
            vec![],
            TransactionData::CreateCollection {
                name: "Art".into(),
                symbol: "ART".into(),
                metadata: vec![],
            },
            0,
            &owner_pair,
        );
        state.apply_transaction(&create_tx).unwrap();
        let collection_id = create_tx.calculate_asset_id().unwrap();

        // Attacker tries to mint
        let mint_tx = Transaction::new(
            attacker.clone(),
            vec![],
            TransactionData::MintNFT {
                collection_id: collection_id,
                item_id: 1,
                item_metadata: vec![],
                recipient: attacker.clone(),
            },
            0,
            &attacker_pair,
        );

        let result = state.apply_transaction(&mint_tx);
        assert!(result.is_err());
        assert_eq!(result.err().unwrap(), "Only issuer can mint");
    }
}
