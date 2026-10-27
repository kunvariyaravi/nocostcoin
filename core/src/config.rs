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

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
pub struct GenesisConfig {
    pub chain_id: u64,
    pub genesis_time: i64,
    pub genesis_seed: String,
    /// Hex-encoded 32-byte Schnorrkel public keys of the founding validators.
    /// These are public keys only - the matching secret keys never appear in
    /// the genesis file, so the genesis can be committed to a public repo.
    #[serde(default)]
    pub initial_validators: Vec<String>,
    /// Testnet/devnet only: seeds from which validator keys are derived.
    /// A validator listed here MUST also set `mining.validator_seed` to the
    /// same string, otherwise its key will not match the genesis entry.
    #[serde(default)]
    pub initial_validator_seeds: Vec<String>,
    /// Hex-encoded 32-byte Ed25519 addresses that receive a genesis balance.
    /// Funding must be declared here (not derived per node) so that every
    /// node computes an identical genesis state.
    #[serde(default)]
    pub initial_funded_accounts: Vec<String>,
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

    /// Move the node to a different P2P port.
    ///
    /// The bind address is kept as configured - only the port changes. Overriding
    /// the port must not silently rebind the node to loopback, which would make
    /// the P2P port unreachable from other hosts.
    pub fn set_port(&mut self, port: u16) {
        self.network.port = port;
        if let Some(idx) = self.network.listen_addr.rfind("/tcp/") {
            self.network.listen_addr =
                format!("{}/tcp/{}", &self.network.listen_addr[..idx], port);
        }
    }

    /// Load or create the default devnet config.
    pub fn default_devnet(port: u16) -> Self {
        Self {
            network: NetworkConfig {
                port,
                bootstrap_peers: vec![],
                listen_addr: format!("/ip4/127.0.0.1/tcp/{}", port),
            },
            genesis: GenesisConfig {
                chain_id: 1337,
                genesis_time: 1766749000000,
                genesis_seed: "nocostcoin-genesis-seed".to_string(),
                initial_validators: vec![],
                initial_validator_seeds: vec![
                    "nocostcoin_node_9000_seed".to_string(),
                    "nocostcoin_node_9001_seed".to_string(),
                    "nocostcoin_node_9002_seed".to_string(),
                ],
                initial_funded_accounts: vec![],
            },
            mining: MiningConfig {
                enabled: true,
                validator_seed: None,
            },
            data_dir: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Overriding the port must move the listen address with it, without
    /// changing the bind address.
    #[test]
    fn test_set_port_keeps_bind_address() {
        let mut config = AppConfig::default_devnet(9000);
        config.network.listen_addr = "/ip4/0.0.0.0/tcp/9000".to_string();

        config.set_port(9001);
        assert_eq!(config.network.port, 9001);
        assert_eq!(config.network.listen_addr, "/ip4/0.0.0.0/tcp/9001");

        config.set_port(9002);
        assert_eq!(config.network.port, 9002);
        assert_eq!(config.network.listen_addr, "/ip4/0.0.0.0/tcp/9002");
    }

    /// Every shipped node config must parse with the current schema.
    ///
    /// This catches config/schema drift - for example a config that still uses
    /// a field the node no longer understands, or is missing a required one.
    #[test]
    fn test_shipped_configs_parse() {
        let dir = std::path::Path::new("../config");
        let mut checked = 0;

        for entry in std::fs::read_dir(dir).expect("config directory") {
            let path = entry.expect("dir entry").path();

            if path.extension().and_then(|e| e.to_str()) != Some("toml") {
                continue;
            }
            // genesis.toml is the canonical [genesis] reference fragment, not a
            // complete node config.
            if path.file_name().and_then(|n| n.to_str()) == Some("genesis.toml") {
                continue;
            }

            AppConfig::load_from_file(&path)
                .unwrap_or_else(|e| panic!("{} failed to parse: {}", path.display(), e));
            checked += 1;
        }

        assert!(checked > 0, "no config files found in {}", dir.display());
    }

    /// The mainnet configs must agree on the genesis, otherwise the nodes fork.
    #[test]
    fn test_mainnet_configs_share_one_genesis() {
        let configs = [
            "../config/mainnet.toml",
            "../config/mainnet2.toml",
            "../config/mainnet3.toml",
            "../config/mainnet-gcp.toml",
        ];

        let mut reference: Option<GenesisConfig> = None;
        for path in configs {
            let cfg = AppConfig::load_from_file(path)
                .unwrap_or_else(|e| panic!("{} failed to parse: {}", path, e));
            match &reference {
                None => reference = Some(cfg.genesis),
                Some(expected) => assert_eq!(
                    &cfg.genesis, expected,
                    "{} has a different genesis - one byte of difference forks the chain",
                    path
                ),
            }
        }
    }

    /// Mainnet must never ship a deterministic validator seed: the seed is the
    /// validator's secret key.
    #[test]
    fn test_mainnet_configs_have_no_validator_seed() {
        for path in [
            "../config/mainnet.toml",
            "../config/mainnet2.toml",
            "../config/mainnet3.toml",
            "../config/mainnet-gcp.toml",
        ] {
            let cfg = AppConfig::load_from_file(path)
                .unwrap_or_else(|e| panic!("{} failed to parse: {}", path, e));
            assert_eq!(cfg.genesis.chain_id, 1, "{} must be chain_id 1", path);
            assert!(
                cfg.mining.validator_seed.is_none(),
                "{} must not set mining.validator_seed",
                path
            );
        }
    }
}
