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
}
