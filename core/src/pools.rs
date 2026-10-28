use sha2::Digest;

/// The protocol account that holds the monthly validator reward pool.
///
/// Rewards are paid out of this pool. The account is derived from a fixed
/// label, so every node computes the same address without it appearing in the
/// genesis file. It holds no private key: the protocol can pay *out* of it,
/// but nobody can spend *from* it.
pub fn reward_pool_address() -> Vec<u8> {
    let mut hasher = sha2::Sha256::new();
    hasher.update(b"nocostcoin-monthly-reward-wallet");
    hasher.finalize().to_vec()
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The pool address must be stable - a different address on each node
    /// would mean the genesis balance and the rewards do not line up.
    #[test]
    fn test_pool_address_is_deterministic() {
        assert_eq!(reward_pool_address(), reward_pool_address());
    }

    #[test]
    fn test_pool_address_is_32_bytes() {
        assert_eq!(reward_pool_address().len(), 32);
    }
}
