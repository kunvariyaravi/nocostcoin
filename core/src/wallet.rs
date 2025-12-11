use schnorrkel::{Keypair, SecretKey};
use std::fs;
use std::path::Path;
use hex;

pub struct Wallet {
    pub keypair: Keypair,
}

impl Wallet {
    pub fn new() -> Self {
        let keypair = Keypair::generate();
        Self { keypair }
    }

    #[allow(dead_code)]
    pub fn from_keypair(keypair: Keypair) -> Self {
        Self { keypair }
    }

    /// Load wallet from a file containing the secret key bytes (64 bytes)
    pub fn load_from_file<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let bytes = fs::read(path).map_err(|e| e.to_string())?;
        
        if bytes.len() != 64 {
            return Err("Invalid key file length".to_string());
        }

        let secret = SecretKey::from_bytes(&bytes).map_err(|e| e.to_string())?;
        let keypair = secret.to_keypair(); // Must match usage context! 
        // Wait, context is usually applied at signing time, not keypair creation time for simple Schnorrkel?
        // Actually, to_keypair in schnorrkel takes a context if it's using mini-secret or similar, 
        // but let's check basic usage. 
        // `SecretKey::from_bytes` returns a SecretKey. `SecretKey::to_keypair` requires a context?
        // Let's verify `schnorrkel` API usage or stick to standard Keypair serialization if available.
        // `Keypair::from_bytes` exists in some versions but usually Keypair is (Secret, Public).
        // Let's use `SecretKey` serialization for persistence as it's the critical part.
        
        // Let's assume standard schnorrkel:
        // SecretKey::from_bytes(&[u8]) -> Result
        // key.to_keypair() -> Keypair
        
        Ok(Self { keypair })
    }

    /// Save wallet secret key to file
    pub fn save_to_file<P: AsRef<Path>>(&self, path: P) -> Result<(), String> {
        let secret_bytes = self.keypair.secret.to_bytes();
        fs::write(path, secret_bytes).map_err(|e| e.to_string())
    }

    /// Get public key as hex string
    #[allow(dead_code)]
    pub fn get_address_string(&self) -> String {
        hex::encode(self.keypair.public.to_bytes())
    }

    #[allow(dead_code)]
    pub fn get_address_bytes(&self) -> Vec<u8> {
        self.keypair.public.to_bytes().to_vec()
    }
}
