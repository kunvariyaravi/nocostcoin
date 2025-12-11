use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vote {
    pub block_hash: String,
    pub slot: u64,
    pub validator_pubkey: Vec<u8>,
    pub signature: Vec<u8>,
}
