use ed25519_dalek::{SigningKey, Signer};
use rand::rngs::OsRng;
use std::fs;
use std::path::Path;
use hex;
use rand::Rng;

pub struct Wallet {
    pub keypair: SigningKey,
}

impl Wallet {
    pub fn new() -> Self {
        let mut csprng = OsRng;
        let keypair = SigningKey::generate(&mut csprng);
        Self { keypair }
    }

    pub fn from_keypair(keypair: SigningKey) -> Self {
        Self { keypair }
    }

    /// Create a new wallet with a random mnemonic
    pub fn create_wallet() -> (Self, String) {
        let mut rng = rand::thread_rng();
        let mut entropy = [0u8; 16]; // 128 bits for 12 words
        rng.fill(&mut entropy);
        
        let mnemonic = bip39::Mnemonic::from_entropy(&entropy).expect("Valid entropy");
        let phrase = mnemonic.to_string(); 
        
        // Regenerate mnemonic from phrase to get seed
        let mnemonic_struct = bip39::Mnemonic::parse(&phrase).expect("Valid phrase");
        let seed = mnemonic_struct.to_seed("");
        
        // Use first 32 bytes of seed for Ed25519 private key
        let mut secret_bytes = [0u8; 32];
        secret_bytes.copy_from_slice(&seed[0..32]);
        let keypair = SigningKey::from_bytes(&secret_bytes);
        
        (Self { keypair }, phrase)
    }

    /// Recover wallet from mnemonic phrase
    pub fn recover_wallet(phrase: &str) -> Result<Self, String> {
        let mnemonic = bip39::Mnemonic::parse(phrase)
            .map_err(|e| format!("Invalid mnemonic: {}", e))?;
            
        let seed = mnemonic.to_seed("");
        
        // Use first 32 bytes of seed for Ed25519 private key
        let mut secret_bytes = [0u8; 32];
        secret_bytes.copy_from_slice(&seed[0..32]);
        let keypair = SigningKey::from_bytes(&secret_bytes);
        
        Ok(Self { keypair })
    }

    /// Load wallet from a file containing the secret key bytes (32 bytes)
    pub fn load_from_file<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let bytes = fs::read(path).map_err(|e| e.to_string())?;
        
        if bytes.len() != 32 {
            return Err(format!("Invalid key file length: expected 32, got {}", bytes.len()));
        }

        let mut secret_bytes = [0u8; 32];
        secret_bytes.copy_from_slice(&bytes);
        let keypair = SigningKey::from_bytes(&secret_bytes);
        
        Ok(Self { keypair })
    }

    /// Save wallet secret key to file
    pub fn save_to_file<P: AsRef<Path>>(&self, path: P) -> Result<(), String> {
        let secret_bytes = self.keypair.to_bytes();
        fs::write(path, secret_bytes).map_err(|e| e.to_string())
    }

    /// Get public key as hex string
    #[allow(dead_code)]
    pub fn get_address_string(&self) -> String {
        hex::encode(self.keypair.verifying_key().to_bytes())
    }

    #[allow(dead_code)]
    pub fn get_address_bytes(&self) -> Vec<u8> {
        self.keypair.verifying_key().to_bytes().to_vec()
    }
}
