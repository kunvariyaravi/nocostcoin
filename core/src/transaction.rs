use serde::{Deserialize, Serialize};
use schnorrkel::{PublicKey, Signature};
use sha2::{Digest, Sha256};

#[derive(Serialize, Deserialize, Debug, Clone, Hash, PartialEq, Eq)]
pub struct Transaction {
    pub sender: Vec<u8>,   // Public key bytes
    pub receiver: Vec<u8>, // Public key bytes
    pub amount: u64,
    pub nonce: u64,
    pub signature: Vec<u8>,
}

impl Transaction {
    pub fn new(sender: Vec<u8>, receiver: Vec<u8>, amount: u64, nonce: u64, keypair: &schnorrkel::Keypair) -> Self {
        let mut tx = Self {
            sender,
            receiver,
            amount,
            nonce,
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
        hasher.update(&self.amount.to_le_bytes());
        hasher.update(&self.nonce.to_le_bytes());
        hasher.finalize().to_vec()
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

    /// Validate transaction logic (amount, addresses)
    pub fn validate_logic(&self) -> Result<(), String> {
        if self.amount == 0 {
            return Err("Amount must be greater than 0".to_string());
        }

        if self.sender.is_empty() {
            return Err("Sender address is empty".to_string());
        }

        if self.receiver.is_empty() {
            return Err("Receiver address is empty".to_string());
        }

        if self.sender == self.receiver {
            return Err("Cannot send to self".to_string());
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
    fn test_transaction_hash() {
        let keypair = Crypto::generate_keypair();
        let tx = Transaction::new(
            vec![1, 2, 3],
            vec![4, 5, 6],
            100,
            0,
            &keypair,
        );
        let hash = tx.hash();
        assert_eq!(hash.len(), 32); // SHA256 output
    }

    #[test]
    fn test_transaction_validation() {
        let keypair = Crypto::generate_keypair();
        let sender = keypair.public.to_bytes().to_vec();
        let tx = Transaction::new(
            sender,
            vec![4, 5, 6],
            100,
            0,
            &keypair,
        );
        assert!(tx.validate().is_ok());
    }

    #[test]
    fn test_invalid_amount() {
        let keypair = Crypto::generate_keypair();
        let tx = Transaction::new(
            vec![1, 2, 3],
            vec![4, 5, 6],
            0,
            0,
            &keypair,
        );
        assert!(tx.validate_logic().is_err());
    }

    #[test]
    fn test_self_transfer() {
        let keypair = Crypto::generate_keypair();
        let sender = keypair.public.to_bytes().to_vec();
        let tx = Transaction::new(
            sender.clone(),
            sender,
            100,
            0,
            &keypair,
        );
        assert!(tx.validate_logic().is_err());
    }
}

