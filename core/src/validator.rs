use std::collections::HashMap;
use serde::{Serialize, Deserialize};

pub const MIN_STAKE: u64 = 1000;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub struct ValidatorInfo {
    pub pubkey: Vec<u8>,
    pub stake: u64,
    pub registered_epoch: u64,
    pub slashed: bool,
}

impl ValidatorInfo {
    pub fn new(pubkey: Vec<u8>, stake: u64, epoch: u64) -> Self {
        Self {
            pubkey,
            stake,
            registered_epoch: epoch,
            slashed: false,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ValidatorSet {
    validators: HashMap<Vec<u8>, ValidatorInfo>, // pubkey -> ValidatorInfo
    total_stake: u64,
}

impl ValidatorSet {
    pub fn new() -> Self {
        Self {
            validators: HashMap::new(),
            total_stake: 0,
        }
    }

    /// Register a new validator with stake
    pub fn register_validator(&mut self, pubkey: Vec<u8>, stake: u64, epoch: u64) -> Result<(), String> {
        if stake < MIN_STAKE {
            return Err(format!("Stake must be at least {}", MIN_STAKE));
        }

        if self.validators.contains_key(&pubkey) {
            return Err("Validator already registered".to_string());
        }

        let validator = ValidatorInfo::new(pubkey.clone(), stake, epoch);
        self.validators.insert(pubkey, validator);
        self.total_stake += stake;

        Ok(())
    }

    /// Unregister a validator and return their stake
    #[allow(dead_code)]
    pub fn unregister_validator(&mut self, pubkey: &[u8]) -> Result<u64, String> {
        let validator = self.validators.remove(pubkey)
            .ok_or("Validator not found")?;
        
        self.total_stake -= validator.stake;
        Ok(validator.stake)
    }

    /// Slash a validator for equivocation (double signing)
    pub fn slash_validator(&mut self, pubkey: &[u8]) -> Result<u64, String> {
        let validator = self.validators.get_mut(pubkey)
            .ok_or("Validator not found")?;
        
        if validator.slashed {
            return Err("Validator already slashed".to_string());
        }

        validator.slashed = true;
        let slashed_amount = validator.stake;
        
        // Remove stake from total
        self.total_stake -= validator.stake;
        validator.stake = 0;
        
        println!("Validator {:?} slashed for {} stake", pubkey, slashed_amount);
        
        Ok(slashed_amount)
    }

    /// Get validator info
    pub fn get_validator(&self, pubkey: &[u8]) -> Option<&ValidatorInfo> {
        self.validators.get(pubkey)
    }

    /// Check if address is a validator
    #[allow(dead_code)]
    pub fn is_validator(&self, pubkey: &[u8]) -> bool {
        self.validators.contains_key(pubkey)
    }

    /// Get total stake
    pub fn get_total_stake(&self) -> u64 {
        self.total_stake
    }

    /// Get number of validators
    #[allow(dead_code)]
    pub fn count(&self) -> usize {
        self.validators.len()
    }

    /// Calculate if a VRF output wins leadership for a slot
    /// Uses stake-weighted probability
    /// Calculate if a VRF output wins leadership for a slot
    /// Uses stake-weighted probability
    pub fn is_slot_leader(&self, pubkey: &[u8], vrf_output: &[u8]) -> bool {
        let validator = match self.get_validator(pubkey) {
            Some(v) => v,
            None => return false,
        };

        if self.total_stake == 0 {
            return false;
        }

        // Calculate threshold based on stake proportion
        // Higher stake = higher chance of being selected
        let stake_ratio = validator.stake as f64 / self.total_stake as f64;
        
        // Convert VRF output to a value between 0 and 1
        let vrf_value = self.vrf_to_probability(vrf_output);
        
        // Validator wins if VRF value < stake ratio
        vrf_value < stake_ratio
    }

    /// Convert VRF output bytes to probability [0, 1]
    /// Convert VRF output bytes to probability [0, 1]
    fn vrf_to_probability(&self, vrf_output: &[u8]) -> f64 {
        if vrf_output.is_empty() {
            return 1.0;
        }

        // Take first 8 bytes and convert to u64
        let mut bytes = [0u8; 8];
        let len = vrf_output.len().min(8);
        bytes[..len].copy_from_slice(&vrf_output[..len]);
        let value = u64::from_le_bytes(bytes);
        
        // Normalize to [0, 1]
        value as f64 / u64::MAX as f64
    }

    /// Get all validators for an epoch
    #[allow(dead_code)]
    pub fn get_validators_for_epoch(&self, epoch: u64) -> Vec<ValidatorInfo> {
        self.validators
            .values()
            .filter(|v| v.registered_epoch <= epoch)
            .cloned()
            .collect()
    }


}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_register_validator() {
        let mut set = ValidatorSet::new();
        let pubkey = vec![1, 2, 3];
        
        let result = set.register_validator(pubkey.clone(), 2000, 0);
        assert!(result.is_ok());
        assert_eq!(set.count(), 1);
        assert_eq!(set.get_total_stake(), 2000);
    }

    #[test]
    fn test_min_stake() {
        let mut set = ValidatorSet::new();
        let pubkey = vec![1, 2, 3];
        
        let result = set.register_validator(pubkey, 500, 0);
        assert!(result.is_err());
    }

    #[test]
    fn test_unregister_validator() {
        let mut set = ValidatorSet::new();
        let pubkey = vec![1, 2, 3];
        
        set.register_validator(pubkey.clone(), 2000, 0).unwrap();
        let stake = set.unregister_validator(&pubkey).unwrap();
        
        assert_eq!(stake, 2000);
        assert_eq!(set.count(), 0);
        assert_eq!(set.get_total_stake(), 0);
    }

    #[test]
    fn test_is_validator() {
        let mut set = ValidatorSet::new();
        let pubkey = vec![1, 2, 3];
        
        assert!(!set.is_validator(&pubkey));
        set.register_validator(pubkey.clone(), 2000, 0).unwrap();
        assert!(set.is_validator(&pubkey));
    }
}
