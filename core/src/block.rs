use crate::transaction::Transaction;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct BlockHeader {
    pub parent_hash: String,
    pub slot: u64,
    pub epoch: u64,
    pub vrf_output: Vec<u8>, // VRFPreOut as bytes
    pub vrf_proof: Vec<u8>,  // VRFProof as bytes
    pub validator_pubkey: Vec<u8>,
    pub producer_signature: Vec<u8>,
    pub state_root: String,
    pub tx_root: String,
    pub extra_witnesses: Vec<Vec<u8>>,
    pub timestamp: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct Block {
    pub header: BlockHeader,
    pub transactions: Vec<Transaction>,
    pub hash: String, // Hash of the header
}

impl Block {
    pub fn new(mut header: BlockHeader, transactions: Vec<Transaction>) -> Self {
        // Calculate and set tx_root
        header.tx_root = Self::calculate_merkle_root(&transactions);
        
        // Calculate hash of the header (which now includes the tx_root)
        let hash = Self::calculate_hash(&header);
        Self {
            header,
            transactions,
            hash,
        }
    }

    pub fn calculate_merkle_root(transactions: &[Transaction]) -> String {
        if transactions.is_empty() {
             return "".to_string();
        }
        
        let mut hashes: Vec<Vec<u8>> = transactions.iter().map(|tx| tx.hash()).collect();
        
        while hashes.len() > 1 {
            let mut next_level = Vec::new();
            for chunk in hashes.chunks(2) {
                let mut hasher = Sha256::new();
                if chunk.len() == 2 {
                    hasher.update(&chunk[0]);
                    hasher.update(&chunk[1]);
                } else {
                     // Odd number, duplicate last
                     hasher.update(&chunk[0]);
                     hasher.update(&chunk[0]);
                }
                next_level.push(hasher.finalize().to_vec());
            }
            hashes = next_level;
        }
        
        hex::encode(&hashes[0])
    }

    pub fn calculate_hash(header: &BlockHeader) -> String {
        use sha2::{Digest, Sha256};
        let serialized = bincode::serialize(header).unwrap();
        let mut hasher = Sha256::new();
        hasher.update(serialized);
        hex::encode(hasher.finalize())
    }
}
