use std::collections::HashMap;
use serde::{Serialize, Deserialize};

/// Refundable deposit a validator locks to join the set.
///
/// It is not stake and it does not buy block-production weight - it only makes
/// creating a large number of fake validators expensive, so that one operator
/// cannot flood the round-robin schedule with throwaway keys.
pub const VALIDATOR_DEPOSIT: u64 = 100;

/// A member of the validator set.
///
/// A validator is identified by its Schnorrkel consensus key, which is also the
/// key it signs blocks and votes with. It holds a refundable deposit, and it
/// counts for exactly one turn in the round-robin schedule.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub struct ValidatorInfo {
    pub pubkey: Vec<u8>,
    /// Ed25519 address that receives this validator's block rewards.
    pub reward_address: Vec<u8>,
    /// Refundable deposit, released when the validator leaves the set.
    pub deposit: u64,
    /// First epoch in which the validator may produce blocks.
    ///
    /// A registration takes effect in the epoch after the one it was included
    /// in, so the active set cannot change while an epoch is running and
    /// historical blocks always re-validate against the same set.
    pub registered_epoch: u64,
    /// Slot of the block that carried the registration. Used as a stable
    /// tiebreaker when ordering validators that joined in the same epoch.
    pub registered_slot: u64,
    pub slashed: bool,
}

impl ValidatorInfo {
    pub fn new(
        pubkey: Vec<u8>,
        reward_address: Vec<u8>,
        deposit: u64,
        epoch: u64,
        slot: u64,
    ) -> Self {
        Self {
            pubkey,
            reward_address,
            deposit,
            registered_epoch: epoch,
            registered_slot: slot,
            slashed: false,
        }
    }
}

/// The set of validators eligible to produce blocks.
///
/// There is no stake weighting: every active validator has an equal chance of
/// being chosen for a slot. The schedule is deterministic and round-robin, so
/// the set is kept in a stable order - by the epoch and slot in which each
/// validator joined.
#[derive(Debug, Clone, Default)]
pub struct ValidatorSet {
    /// Validators in schedule order.
    validators: Vec<ValidatorInfo>,
    /// Fast lookup by pubkey.
    index: HashMap<Vec<u8>, usize>,
}

impl ValidatorSet {
    pub fn new() -> Self {
        Self {
            validators: Vec::new(),
            index: HashMap::new(),
        }
    }

    /// Rebuild a set from a stored list, preserving its order.
    pub fn from_validators(validators: Vec<ValidatorInfo>) -> Self {
        let mut set = Self::new();
        set.validators = validators;
        set.reindex();
        set
    }

    /// Register a new validator with a refundable deposit.
    pub fn register_validator(
        &mut self,
        pubkey: Vec<u8>,
        reward_address: Vec<u8>,
        deposit: u64,
        epoch: u64,
        slot: u64,
    ) -> Result<(), String> {
        if deposit < VALIDATOR_DEPOSIT {
            return Err(format!("Deposit must be at least {}", VALIDATOR_DEPOSIT));
        }

        if self.index.contains_key(&pubkey) {
            return Err("Validator already registered".to_string());
        }

        self.validators.push(ValidatorInfo::new(
            pubkey,
            reward_address,
            deposit,
            epoch,
            slot,
        ));
        self.sort();
        self.reindex();

        Ok(())
    }

    /// Keep the set in schedule order: by the epoch a validator joined, then by
    /// the slot it joined in.
    fn sort(&mut self) {
        self.validators.sort_by(|a, b| {
            a.registered_epoch
                .cmp(&b.registered_epoch)
                .then(a.registered_slot.cmp(&b.registered_slot))
        });
    }

    fn reindex(&mut self) {
        self.index.clear();
        for (i, v) in self.validators.iter().enumerate() {
            self.index.insert(v.pubkey.clone(), i);
        }
    }

    /// Remove a validator and return its deposit for refund.
    pub fn unregister_validator(&mut self, pubkey: &[u8]) -> Result<u64, String> {
        let idx = *self
            .index
            .get(pubkey)
            .ok_or("Validator not found")?;

        if self.validators[idx].slashed {
            return Err("Validator was slashed".to_string());
        }

        let deposit = self.validators[idx].deposit;
        self.validators.remove(idx);
        self.reindex();

        Ok(deposit)
    }

    /// Slash a validator for equivocation (double signing).
    ///
    /// The deposit is forfeited rather than refunded.
    pub fn slash_validator(&mut self, pubkey: &[u8]) -> Result<u64, String> {
        let idx = *self
            .index
            .get(pubkey)
            .ok_or("Validator not found")?;

        if self.validators[idx].slashed {
            return Err("Validator already slashed".to_string());
        }

        let deposit = self.validators[idx].deposit;
        self.validators[idx].slashed = true;
        self.validators[idx].deposit = 0;

        println!("Validator {:?} slashed, {} deposit forfeited", pubkey, deposit);

        Ok(deposit)
    }

    /// Get validator info.
    pub fn get_validator(&self, pubkey: &[u8]) -> Option<&ValidatorInfo> {
        self.index.get(pubkey).map(|&i| &self.validators[i])
    }

    /// Check if a key is a validator.
    pub fn is_validator(&self, pubkey: &[u8]) -> bool {
        self.index.contains_key(pubkey)
    }

    /// Get number of validators.
    pub fn count(&self) -> usize {
        self.validators.len()
    }

    /// Get total deposit held by the set.
    pub fn get_total_deposit(&self) -> u64 {
        self.validators.iter().map(|v| v.deposit).sum()
    }

    /// Get all validators, in schedule order.
    pub fn get_all_validators(&self) -> Vec<ValidatorInfo> {
        self.validators.clone()
    }

    /// The validators eligible to produce a block, in schedule order.
    pub fn get_active_validators(&self) -> Vec<ValidatorInfo> {
        self.validators
            .iter()
            .filter(|v| !v.slashed)
            .cloned()
            .collect()
    }

    /// The validators that were active in `epoch`, in schedule order.
    ///
    /// A validator joins in the epoch after its registration, so the set for
    /// an epoch is fixed once that epoch starts. This is what lets an old
    /// block re-validate against exactly the set that was live when it was
    /// produced.
    pub fn get_validators_for_epoch(&self, epoch: u64) -> Vec<ValidatorInfo> {
        self.validators
            .iter()
            .filter(|v| !v.slashed && v.registered_epoch <= epoch)
            .cloned()
            .collect()
    }

    /// The validator whose turn it is for `slot`, within `epoch`.
    ///
    /// The schedule is round-robin over the validators active in that epoch,
    /// so every active validator gets an equal share of the slots. This is
    /// what replaced the stake-weighted lottery: it is fully deterministic, and
    /// it does not reward holding more coins.
    pub fn leader_for_slot(&self, slot: u64, epoch: u64) -> Option<ValidatorInfo> {
        let active = self.get_validators_for_epoch(epoch);
        if active.is_empty() {
            return None;
        }
        let idx = (slot % active.len() as u64) as usize;
        Some(active[idx].clone())
    }

    /// Whether `pubkey` is allowed to produce a block in `slot`.
    pub fn is_slot_leader(&self, pubkey: &[u8], slot: u64, epoch: u64) -> bool {
        match self.leader_for_slot(slot, epoch) {
            Some(leader) => leader.pubkey == pubkey,
            None => false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_register_validator() {
        let mut set = ValidatorSet::new();
        let pubkey = vec![1, 2, 3];

        let result = set.register_validator(pubkey.clone(), vec![9], VALIDATOR_DEPOSIT, 0, 0);
        assert!(result.is_ok());
        assert_eq!(set.count(), 1);
        assert_eq!(set.get_total_deposit(), VALIDATOR_DEPOSIT);
    }

    #[test]
    fn test_min_deposit() {
        let mut set = ValidatorSet::new();
        let pubkey = vec![1, 2, 3];

        let result = set.register_validator(pubkey, vec![9], VALIDATOR_DEPOSIT - 1, 0, 0);
        assert!(result.is_err());
    }

    #[test]
    fn test_unregister_validator() {
        let mut set = ValidatorSet::new();
        let pubkey = vec![1, 2, 3];

        set.register_validator(pubkey.clone(), vec![9], VALIDATOR_DEPOSIT, 0, 0).unwrap();
        let deposit = set.unregister_validator(&pubkey).unwrap();

        assert_eq!(deposit, VALIDATOR_DEPOSIT);
        assert_eq!(set.count(), 0);
        assert_eq!(set.get_total_deposit(), 0);
    }

    #[test]
    fn test_is_validator() {
        let mut set = ValidatorSet::new();
        let pubkey = vec![1, 2, 3];

        assert!(!set.is_validator(&pubkey));
        set.register_validator(pubkey.clone(), vec![9], VALIDATOR_DEPOSIT, 0, 0).unwrap();
        assert!(set.is_validator(&pubkey));
    }

    /// Every active validator must get an equal share of the slots - no
    /// validator may buy extra turns by holding more coins.
    #[test]
    fn test_round_robin_is_equal_weight() {
        let mut set = ValidatorSet::new();
        set.register_validator(vec![1], vec![9], VALIDATOR_DEPOSIT, 0, 0).unwrap();
        set.register_validator(vec![2], vec![9], VALIDATOR_DEPOSIT, 0, 1).unwrap();
        set.register_validator(vec![3], vec![9], VALIDATOR_DEPOSIT, 0, 2).unwrap();

        let mut counts = [0u32; 3];
        for slot in 0..30 {
            let leader = set.leader_for_slot(slot, 0).unwrap();
            match leader.pubkey[0] {
                1 => counts[0] += 1,
                2 => counts[1] += 1,
                _ => counts[2] += 1,
            }
        }

        assert_eq!(counts, [10, 10, 10], "each validator should get 1/N of slots");
    }

    /// A validator that registers mid-epoch must not take part in that epoch.
    #[test]
    fn test_registration_takes_effect_next_epoch() {
        let mut set = ValidatorSet::new();
        set.register_validator(vec![1], vec![9], VALIDATOR_DEPOSIT, 0, 0).unwrap();
        set.register_validator(vec![2], vec![9], VALIDATOR_DEPOSIT, 5, 100).unwrap();

        assert_eq!(set.get_validators_for_epoch(4).len(), 1);
        assert_eq!(set.get_validators_for_epoch(5).len(), 2);
    }

    /// A slashed validator must not win a slot, and must not block the others.
    #[test]
    fn test_slashed_validator_is_skipped() {
        let mut set = ValidatorSet::new();
        set.register_validator(vec![1], vec![9], VALIDATOR_DEPOSIT, 0, 0).unwrap();
        set.register_validator(vec![2], vec![9], VALIDATOR_DEPOSIT, 0, 1).unwrap();

        set.slash_validator(&[1]).unwrap();

        assert_eq!(set.get_active_validators().len(), 1);
        assert!(!set.is_slot_leader(&[1], 0, 0));
        assert!(set.is_slot_leader(&[2], 0, 0));
    }

    /// Removing a validator must not corrupt the lookup index for the others.
    #[test]
    fn test_unregister_keeps_index_consistent() {
        let mut set = ValidatorSet::new();
        set.register_validator(vec![1], vec![9], VALIDATOR_DEPOSIT, 0, 0).unwrap();
        set.register_validator(vec![2], vec![9], VALIDATOR_DEPOSIT, 0, 1).unwrap();
        set.register_validator(vec![3], vec![9], VALIDATOR_DEPOSIT, 0, 2).unwrap();

        set.unregister_validator(&[2]).unwrap();

        assert_eq!(set.count(), 2);
        assert!(set.get_validator(&[1]).is_some());
        assert!(set.get_validator(&[2]).is_none());
        assert!(set.get_validator(&[3]).is_some());
        assert!(set.is_validator(&[3]));
    }
}
