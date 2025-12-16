use schnorrkel::{Keypair, SecretKey};
use std::fs;
use std::path::Path;
use hex;
use rand::Rng;

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



    /// Create a new wallet with a random mnemonic
    pub fn create_wallet() -> (Self, String) {
        let mut rng = rand::thread_rng();
        let mut entropy = [0u8; 16]; // 128 bits for 12 words
        rng.fill(&mut entropy);
        
        let mnemonic = bip39::Mnemonic::from_entropy(&entropy).expect("Valid entropy");
        let phrase = mnemonic.to_string(); // phrase() returns &str, to_string() owns it
        
        // Regenerate mnemonic from phrase to get seed (redundant but confirms reversibility)
        let mnemonic_struct = bip39::Mnemonic::parse(&phrase).expect("Valid phrase");
        let seed = mnemonic_struct.to_seed("");
        
        // Use seed to generate secret
        let mini_secret = schnorrkel::MiniSecretKey::from_bytes(&seed[0..32]).expect("Seed should be at least 32 bytes");
        let secret = mini_secret.expand(schnorrkel::ExpansionMode::Ed25519);
        let keypair = secret.to_keypair();
        
        (Self { keypair }, phrase)
    }

    /// Recover wallet from mnemonic phrase
    pub fn recover_wallet(phrase: &str) -> Result<Self, String> {
        // bip39 2.0 often uses parse or from_phrase
        // Error log showed parse_in_normalized... so probably parse is available or verify.
        // Let's rely on Mnemonic::parse or similar.
        let mnemonic = bip39::Mnemonic::parse(phrase)
            .map_err(|e| format!("Invalid mnemonic: {}", e))?;
            
        let seed = mnemonic.to_seed("");
        let mini_secret = schnorrkel::MiniSecretKey::from_bytes(&seed[0..32]).expect("Seed should be at least 32 bytes");
        let secret = mini_secret.expand(schnorrkel::ExpansionMode::Ed25519);
        let keypair = secret.to_keypair();
        
        Ok(Self { keypair })
    }

    /// Load wallet from a file containing the secret key bytes (64 bytes)
    pub fn load_from_file<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let bytes = fs::read(path).map_err(|e| e.to_string())?;
        
        if bytes.len() != 64 {
            return Err("Invalid key file length".to_string());
        }

        let secret = SecretKey::from_bytes(&bytes).map_err(|e| e.to_string())?;
        let keypair = secret.to_keypair(); 
        
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
