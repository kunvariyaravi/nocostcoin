use schnorrkel::{Keypair, PublicKey, vrf::{VRFPreOut, VRFProof}};
use rand::rngs::OsRng;

pub struct Crypto;

impl Crypto {
    pub fn generate_keypair() -> Keypair {
        Keypair::generate_with(OsRng)
    }

    // VRF Sign: Returns (Output, Proof)
    // Input is usually the seed (e.g., previous block VRF output or epoch randomness)
    pub fn vrf_sign(keypair: &Keypair, input: &[u8]) -> (VRFPreOut, VRFProof) {
        let context = schnorrkel::signing_context(b"nocostcoin-vrf");
        let (io, proof, _) = keypair.vrf_sign(context.bytes(input));
        (io.to_preout(), proof)
    }

    // VRF Verify
    pub fn vrf_verify(
        public_key: &PublicKey,
        input: &[u8],
        output: &VRFPreOut,
        proof: &VRFProof,
    ) -> bool {
        let context = schnorrkel::signing_context(b"nocostcoin-vrf");
        public_key
            .vrf_verify(context.bytes(input), output, proof)
            .is_ok()
    }

    /// Sign a message with a Schnorrkel key.
    ///
    /// Used by a validator to prove it holds the consensus key it registers.
    pub fn schnorrkel_sign(keypair: &Keypair, message: &[u8]) -> Vec<u8> {
        let context = schnorrkel::signing_context(b"nocostcoin-register-validator");
        keypair.sign(context.bytes(message)).to_bytes().to_vec()
    }

    /// Verify a Schnorrkel signature over a message.
    pub fn schnorrkel_verify(public_key: &[u8], message: &[u8], signature: &[u8]) -> bool {
        let pubkey = match PublicKey::from_bytes(public_key) {
            Ok(p) => p,
            Err(_) => return false,
        };
        let sig = match schnorrkel::Signature::from_bytes(signature) {
            Ok(s) => s,
            Err(_) => return false,
        };
        let context = schnorrkel::signing_context(b"nocostcoin-register-validator");
        pubkey.verify(context.bytes(message), &sig).is_ok()
    }
}
