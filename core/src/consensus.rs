use crate::block::{Block, BlockHeader};
use sha2::Digest;
use chrono::Utc;
use crate::validator::ValidatorSet;


pub const SLOT_DURATION_MS: u64 = 2000; // 2 seconds
pub const SLOTS_PER_EPOCH: u64 = 1800; // 1 hour / 2 seconds = 1800 slots


pub struct Consensus {
    genesis_time: i64,
}

impl Consensus {
    pub fn new(genesis_time: i64) -> Self {
        Self { genesis_time }
    }

    pub fn get_current_slot(&self) -> u64 {
        let now = Utc::now().timestamp_millis();
        if now < self.genesis_time {
            return 0;
        }
        ((now - self.genesis_time) as u64) / SLOT_DURATION_MS
    }

    pub fn get_epoch(&self, slot: u64) -> u64 {
        slot / SLOTS_PER_EPOCH
    }

    // Fork Choice Rule: Longest Chain (Highest Slot) with VRF Tiebreaker
    // 1. Higher slot always wins
    // 2. For equal slots, lower VRF output wins (more difficult)
    pub fn is_better_block(new_block: &Block, current_head: &Block) -> bool {
        // Rule 1: Higher slot wins
        if new_block.header.slot > current_head.header.slot {
             return true;
        }
        
        // Rule 2: For equal slots, use VRF output as tiebreaker (lower wins)
        if new_block.header.slot == current_head.header.slot {
            return new_block.header.vrf_output < current_head.header.vrf_output;
        }
        
        // Lower slot loses
        false
    }

    // get_proposer_rank removed for Secret Leader Election



    /// Validate a block against the consensus rules
    pub fn validate_block(&self, block: &Block, parent: &Block, validators: &ValidatorSet) -> Result<(), String> {
        // 1. Parent Continuity
        if block.header.parent_hash != parent.hash {
            return Err("Parent hash mismatch".to_string());
        }

        // 2. Slot Correctness
        if block.header.slot <= parent.header.slot {
            return Err(format!("Slot must be greater than parent slot. Block: {}, Parent: {}", block.header.slot, parent.header.slot));
        }

        // 3. VRF Eligibility Check (Secret Leader Election)
        // Public Key & VRF Proof Verification
         let pubkey = schnorrkel::PublicKey::from_bytes(&block.header.validator_pubkey)
            .map_err(|_| "Invalid validator pubkey".to_string())?;
         let vrf_preout = schnorrkel::vrf::VRFPreOut::from_bytes(&block.header.vrf_output)
            .map_err(|_| "Invalid VRF output".to_string())?;
         let vrf_proof = schnorrkel::vrf::VRFProof::from_bytes(&block.header.vrf_proof)
            .map_err(|_| "Invalid VRF proof".to_string())?;
         
         // Re-compute seed from parent to ensure they used the right input
         let seed = Self::compute_vrf_seed(&parent.header.vrf_output, block.header.slot);
         
         if !crate::crypto::Crypto::vrf_verify(&pubkey, &seed, &vrf_preout, &vrf_proof) {
             return Err("Invalid VRF signature/proof".to_string());
         }

        // 4. Stake-Weighted Threshold Check (Did they allowably win?)
        // This replaces the Rank check.
        if !validators.is_slot_leader(&block.header.validator_pubkey, &block.header.vrf_output) {
            return Err("Validator VRF output did not meets the stake-weighted threshold (Not a leader)".to_string());
        }

        // 6. Transaction Root Validation
        let calculated_root = Block::calculate_merkle_root(&block.transactions);
        if block.header.tx_root != calculated_root {
            return Err(format!("Invalid tx_root. Header: {}, Calculated: {}", block.header.tx_root, calculated_root));
        }

        Ok(())
    }
    
    pub fn compute_vrf_seed(parent_vrf_output: &[u8], slot: u64) -> Vec<u8> {
        let mut hasher = sha2::Sha256::new();
        hasher.update(parent_vrf_output);
        hasher.update(slot.to_le_bytes());
        hasher.finalize().to_vec()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_dummy_block(slot: u64, vrf_output: Vec<u8>) -> Block {
        Block {
            header: BlockHeader {
                parent_hash: "0".to_string(),
                slot,
                epoch: slot / SLOTS_PER_EPOCH,
                validator_pubkey: vec![],
                producer_signature: vec![],

                state_root: "".to_string(),
                // Empty transactions -> empty root ""
                tx_root: Block::calculate_merkle_root(&vec![]), 
                extra_witnesses: vec![],
                vrf_proof: vec![],
                vrf_output,
                timestamp: 0,
            },
            hash: "hash".to_string(),
            transactions: vec![],
        }
    }

    #[test]
    fn test_epoch_calculation() {
        let consensus = Consensus::new(0);
        assert_eq!(consensus.get_epoch(0), 0);
        assert_eq!(consensus.get_epoch(1799), 0);
        assert_eq!(consensus.get_epoch(1800), 1);
        assert_eq!(consensus.get_epoch(3600), 2);
    }

    #[test]
    fn test_fork_choice_longest_chain() {
        let block_a = create_dummy_block(10, vec![0]);
        let block_b = create_dummy_block(11, vec![0]);
        
        // Higher slot wins
        assert!(Consensus::is_better_block(&block_b, &block_a));
        assert!(!Consensus::is_better_block(&block_a, &block_b));
    }




}
