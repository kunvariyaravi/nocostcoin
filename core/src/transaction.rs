use serde::{Deserialize, Serialize};
use schnorrkel::{PublicKey, Signature};
use sha2::{Digest, Sha256};

#[derive(Serialize, Deserialize, Debug, Clone, Hash, PartialEq, Eq)]
pub enum TransactionData {
    NativeTransfer {
        amount: u64,
    },
    CreateAsset {
        name: String,
        symbol: String,
        supply: u64,
        decimals: u8,
        metadata: Vec<u8>,
    },
    TransferAsset {
        asset_id: Vec<u8>,
        amount: u64,
    },
    CreateCollection {
        name: String,
        symbol: String,
        metadata: Vec<u8>,
    },
    MintNFT {
        collection_id: Vec<u8>,
        item_id: u64,
        item_metadata: Vec<u8>,
        recipient: Vec<u8>,
    },
    TransferNFT {
        collection_id: Vec<u8>,
        item_id: u64,
    },
    // AI Economy & Streaming
    OpenChannel {
        partner: Vec<u8>,
        amount: u64,
        duration: u64, // Duration in slots or blocks
    },
    CloseChannel {
        channel_id: Vec<u8>,
        balance_proof: Vec<u8>, 
        final_balance_a: u64,
        final_balance_b: u64,
    },
    DelegateSpend {
        delegate: Vec<u8>,
        allowance: u64,
        expiry: u64, // Epoch or slot
    },
    // Native Lending
    LendingSupply {
        asset_id: Vec<u8>,
        amount: u64,
    },
    LendingWithdraw {
        asset_id: Vec<u8>,
        amount: u64,
    },
    LendingBorrow {
        asset_id: Vec<u8>,
        amount: u64,
        collateral_asset_id: Vec<u8>,
    },
    LendingRepay {
        asset_id: Vec<u8>,
        amount: u64,
    },
}

#[derive(Serialize, Deserialize, Debug, Clone, Hash, PartialEq, Eq)]
pub struct Transaction {
    pub sender: Vec<u8>,   // Public key bytes
    pub receiver: Vec<u8>, // Public key bytes (Optional for some types)
    pub nonce: u64,
    pub data: TransactionData,
    pub signature: Vec<u8>,
}

impl Transaction {
    pub fn new(
        sender: Vec<u8>, 
        receiver: Vec<u8>, 
        data: TransactionData, 
        nonce: u64, 
        keypair: &schnorrkel::Keypair
    ) -> Self {
        let mut tx = Self {
            sender,
            receiver,
            nonce,
            data,
            signature: vec![],
        };
        
        let message = tx.hash();
        let context = schnorrkel::signing_context(b"nocostcoin-tx");
        let signature = keypair.sign(context.bytes(&message));
        tx.signature = signature.to_bytes().to_vec();
        
        tx
    }

    /// Create transaction hash for signing
    pub fn hash(&self) -> Vec<u8> {
        let mut hasher = Sha256::new();
        hasher.update(&self.sender);
        hasher.update(&self.receiver);
        hasher.update(&self.nonce.to_le_bytes());
        
        // Hash the data enum
        match &self.data {
            TransactionData::NativeTransfer { amount } => {
                hasher.update(b"NativeTransfer");
                hasher.update(amount.to_le_bytes());
            },
            TransactionData::CreateAsset { name, symbol, supply, decimals, metadata } => {
                hasher.update(b"CreateAsset");
                hasher.update(name.as_bytes());
                hasher.update(symbol.as_bytes());
                hasher.update(supply.to_le_bytes());
                hasher.update(&[*decimals]);
                hasher.update(metadata);
            },
            TransactionData::TransferAsset { asset_id, amount } => {
                hasher.update(b"TransferAsset");
                hasher.update(asset_id);
                hasher.update(amount.to_le_bytes());
            },
            TransactionData::CreateCollection { name, symbol, metadata } => {
                hasher.update(b"CreateCollection");
                hasher.update(name.as_bytes());
                hasher.update(symbol.as_bytes());
                hasher.update(metadata);
            },
            TransactionData::MintNFT { collection_id, item_id, item_metadata, recipient } => {
                hasher.update(b"MintNFT");
                hasher.update(collection_id);
                hasher.update(item_id.to_le_bytes());
                hasher.update(item_metadata);
                hasher.update(recipient);
            },
            TransactionData::TransferNFT { collection_id, item_id } => {
                hasher.update(b"TransferNFT");
                hasher.update(collection_id);
                hasher.update(item_id.to_le_bytes());
            },
             TransactionData::OpenChannel { partner, amount, duration } => {
                hasher.update(b"OpenChannel");
                hasher.update(partner);
                hasher.update(amount.to_le_bytes());
                hasher.update(duration.to_le_bytes());
            },
            TransactionData::CloseChannel { channel_id, balance_proof, final_balance_a, final_balance_b } => {
                hasher.update(b"CloseChannel");
                hasher.update(channel_id);
                hasher.update(balance_proof);
                hasher.update(final_balance_a.to_le_bytes());
                hasher.update(final_balance_b.to_le_bytes());
            },
            TransactionData::DelegateSpend { delegate, allowance, expiry } => {
                hasher.update(b"DelegateSpend");
                hasher.update(delegate);
                hasher.update(allowance.to_le_bytes());
                hasher.update(expiry.to_le_bytes());
            },
            TransactionData::LendingSupply { asset_id, amount } => {
                hasher.update(b"LendingSupply");
                hasher.update(asset_id);
                hasher.update(amount.to_le_bytes());
            },
            TransactionData::LendingWithdraw { asset_id, amount } => {
                hasher.update(b"LendingWithdraw");
                hasher.update(asset_id);
                hasher.update(amount.to_le_bytes());
            },
            TransactionData::LendingBorrow { asset_id, amount, collateral_asset_id } => {
                hasher.update(b"LendingBorrow");
                hasher.update(asset_id);
                hasher.update(amount.to_le_bytes());
                hasher.update(collateral_asset_id);
            },
             TransactionData::LendingRepay { asset_id, amount } => {
                hasher.update(b"LendingRepay");
                hasher.update(asset_id);
                hasher.update(amount.to_le_bytes());
            },
        }

        hasher.finalize().to_vec()
    }

    // Helper to calculate Asset ID (Hash of sender + nonce + name)
    pub fn calculate_asset_id(&self) -> Option<Vec<u8>> {
        match &self.data {
            TransactionData::CreateAsset { name, .. } => {
                let mut hasher = Sha256::new();
                hasher.update(&self.sender);
                hasher.update(self.nonce.to_le_bytes());
                hasher.update(name.as_bytes());
                Some(hasher.finalize().to_vec())
            },
            TransactionData::CreateCollection { name, .. } => {
                let mut hasher = Sha256::new();
                hasher.update(&self.sender);
                hasher.update(self.nonce.to_le_bytes());
                hasher.update(name.as_bytes());
                Some(hasher.finalize().to_vec())
            },
            TransactionData::OpenChannel { .. } => {
                let mut hasher = Sha256::new();
                hasher.update(&self.sender);
                hasher.update(self.nonce.to_le_bytes());
                hasher.update(b"channel");
                Some(hasher.finalize().to_vec())
            },
            _ => None
        }
    }

    /// Validate transaction signature
    pub fn validate_signature(&self) -> Result<(), String> {
        if self.signature.is_empty() {
            return Err("Empty signature".to_string());
        }

        let public_key = PublicKey::from_bytes(&self.sender)
            .map_err(|_| "Invalid sender public key")?;

        let signature = Signature::from_bytes(&self.signature)
            .map_err(|_| "Invalid signature format")?;

        let message = self.hash();
        let context = schnorrkel::signing_context(b"nocostcoin-tx");

        public_key
            .verify(context.bytes(&message), &signature)
            .map_err(|_| "Signature verification failed".to_string())?;

        Ok(())
    }

    /// Validate transaction logic (amount, addresses, data)
    pub fn validate_logic(&self) -> Result<(), String> {
        if self.sender.is_empty() {
            return Err("Sender address is empty".to_string());
        }

        match &self.data {
            TransactionData::NativeTransfer { amount } => {
                if *amount == 0 {
                    return Err("Amount must be greater than 0".to_string());
                }
                if self.receiver.is_empty() {
                    return Err("Receiver address is empty".to_string());
                }
                if self.sender == self.receiver {
                    return Err("Cannot send to self".to_string());
                }
            },
            TransactionData::CreateAsset { name, symbol, supply, .. } => {
                if name.is_empty() || symbol.is_empty() {
                    return Err("Asset name and symbol cannot be empty".to_string());
                }
                if *supply == 0 {
                    return Err("Supply must be greater than 0".to_string());
                }
            },
            TransactionData::TransferAsset { asset_id: _, amount } => {
                if *amount == 0 {
                    return Err("Amount must be greater than 0".to_string());
                }
                if self.receiver.is_empty() {
                    return Err("Receiver address is empty".to_string());
                }
            },
            TransactionData::CreateCollection { name, symbol, .. } => {
                if name.is_empty() || symbol.is_empty() {
                    return Err("Collection name and symbol cannot be empty".to_string());
                }
            },
            TransactionData::MintNFT { collection_id, .. } => {
                if collection_id.is_empty() {
                   return Err("Collection ID cannot be empty".to_string());
                }
            },
            TransactionData::TransferNFT { collection_id, .. } => {
                 if collection_id.is_empty() {
                   return Err("Collection ID cannot be empty".to_string());
                }
                if self.receiver.is_empty() {
                    return Err("Receiver address is empty".to_string());
                }
            },
             TransactionData::OpenChannel { partner, amount, .. } => {
                if partner.is_empty() {
                    return Err("Partner address required".to_string());
                }
                if *amount == 0 {
                    return Err("Channel must have initial deposit".to_string());
                }
            },
            TransactionData::CloseChannel { channel_id, .. } => {
                if channel_id.is_empty() {
                    return Err("Channel ID required".to_string());
                }
            },
            TransactionData::DelegateSpend { delegate, allowance, .. } => {
                if delegate.is_empty() {
                    return Err("Delegate address required".to_string());
                }
                if *allowance == 0 {
                    return Err("Allowance must be > 0".to_string());
                }
            },
            TransactionData::LendingSupply { asset_id, amount } => {
                if asset_id.is_empty() {
                    return Err("Asset ID required".to_string());
                }
                if *amount == 0 {
                    return Err("Amount must be > 0".to_string());
                }
            },
            TransactionData::LendingWithdraw { asset_id, amount } => {
                 if asset_id.is_empty() {
                    return Err("Asset ID required".to_string());
                }
                if *amount == 0 {
                    return Err("Amount must be > 0".to_string());
                }
            },
            TransactionData::LendingBorrow { asset_id, amount, collateral_asset_id } => {
                if asset_id.is_empty() || collateral_asset_id.is_empty() {
                     return Err("Asset IDs required".to_string());
                }
                if *amount == 0 {
                    return Err("Amount must be > 0".to_string());
                }
            },
             TransactionData::LendingRepay { asset_id, amount } => {
                 if asset_id.is_empty() {
                    return Err("Asset ID required".to_string());
                }
                if *amount == 0 {
                    return Err("Amount must be > 0".to_string());
                }
            },
        }

        Ok(())
    }

    /// Full validation (signature + logic)
    pub fn validate(&self) -> Result<(), String> {
        self.validate_logic()?;
        self.validate_signature()?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::Crypto;

    #[test]
    fn test_native_transfer() {
        let keypair = Crypto::generate_keypair();
        let sender = keypair.public.to_bytes().to_vec();
        let receiver = vec![4, 5, 6];
        
        let tx = Transaction::new(
            sender,
            receiver,
            TransactionData::NativeTransfer { amount: 100 },
            0,
            &keypair,
        );
        assert!(tx.validate().is_ok());
    }

    #[test]
    fn test_create_asset() {
        let keypair = Crypto::generate_keypair();
        let sender = keypair.public.to_bytes().to_vec();
        
        let tx = Transaction::new(
            sender,
            vec![], // Receiver not needed for creation
            TransactionData::CreateAsset { 
                name: "Gold".to_string(), 
                symbol: "GLD".to_string(), 
                supply: 1000, 
                decimals: 8, 
                metadata: vec![] 
            },
            0,
            &keypair,
        );
        assert!(tx.validate().is_ok());
        assert!(tx.calculate_asset_id().is_some());
    }
}


