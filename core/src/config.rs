use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use chrono::Utc;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct AppConfig {
    pub network: NetworkConfig,
    pub genesis: GenesisConfig,
    pub mining: MiningConfig,
    pub data_dir: Option<std::path::PathBuf>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct NetworkConfig {
    pub port: u16,
    pub bootstrap_peers: Vec<String>,
    pub listen_addr: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct GenesisConfig {
    pub genesis_time: i64,
    pub genesis_seed: String,
    pub initial_validators: Vec<String>, // List of seeds for initial validators
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MiningConfig {
    pub enabled: bool,
    pub validator_seed: Option<String>, // For deterministic testnets
}

impl AppConfig {
    pub fn load_from_file<P: AsRef<Path>>(path: P) -> Result<Self, Box<dyn std::error::Error>> {
        let content = fs::read_to_string(path)?;
        let config: AppConfig = toml::from_str(&content)?;
        Ok(config)
    }

    pub fn default_devnet(port: u16) -> Self {
        Self {
            network: NetworkConfig {
                port,
                bootstrap_peers: vec![],
                listen_addr: format!("/ip4/127.0.0.1/tcp/{}", port),
            },
            genesis: GenesisConfig {
                genesis_time: 1766749000000,
                genesis_seed: "nocostcoin-genesis-seed".to_string(),
                initial_validators: vec![
                    "nocostcoin_node_9000_seed".to_string(),
                    "nocostcoin_node_9001_seed".to_string(),
                    "nocostcoin_node_9002_seed".to_string(),
                ],
            },
            mining: MiningConfig {
                enabled: true,
                validator_seed: None,
            },
            data_dir: None,
        }
    }
}
