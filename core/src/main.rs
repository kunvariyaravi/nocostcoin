use nocostcoin::node::{load_or_create_identity, Node};
use nocostcoin::config::AppConfig;
use clap::Parser;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to configuration file
    #[arg(short, long, default_value = "config/nocostcoin.toml")]
    config: PathBuf,

    /// Override listening port
    #[arg(long)]
    port: Option<u16>,

    /// Override the P2P listen address (e.g. /ip4/0.0.0.0/tcp/9000)
    #[arg(long)]
    listen: Option<String>,

    /// Override the data directory (chain database, validator key, wallet)
    #[arg(long)]
    data_dir: Option<PathBuf>,

    /// Override bootstrap peers (comma separated)
    #[arg(long)]
    bootstrap: Option<String>,

    /// Enable/Disable mining
    #[arg(long)]
    mining: Option<bool>,

    /// Print this node's validator identity (consensus pubkey + wallet address)
    /// and exit. Used for the genesis ceremony.
    #[arg(long)]
    identity: bool,
}

#[tokio::main]
async fn main() {
    // Initialize structured logging
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let args = Args::parse();

    tracing::info!("Loading configuration from {:?}", args.config);

    // 1. Load Config
    let mut config = if args.config.exists() {
        AppConfig::load_from_file(&args.config)
            .unwrap_or_else(|e| {
                eprintln!("Failed to load config file: {}", e);
                std::process::exit(1);
            })
    } else {
        println!("Config file not found, using default Devnet config for port 9000");
        AppConfig::default_devnet(9000)
    };

    // 2. Apply Overrides
    if let Some(port) = args.port {
        config.set_port(port);
    }

    // The listen address is configured separately from the port.
    if let Some(listen) = args.listen {
        config.network.listen_addr = listen;
    }

    if let Some(data_dir) = args.data_dir {
        config.data_dir = Some(data_dir);
    }

    if let Some(bootstrap) = args.bootstrap {
        config.network.bootstrap_peers = bootstrap
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
    }

    if let Some(mining) = args.mining {
        config.mining.enabled = mining;
    }

    // Mainnet must not run on a deterministic validator seed. The seed IS the
    // validator's secret key, so a seed committed to the genesis file would
    // let anyone forge blocks for that validator.
    if config.genesis.chain_id == 1 && config.mining.validator_seed.is_some() {
        eprintln!(
            "FATAL: mainnet (chain_id 1) forbids mining.validator_seed - it is the \
             validator's secret key. Remove it from the config."
        );
        std::process::exit(1);
    }

    // 3. Genesis ceremony: print this node's identity and exit.
    if args.identity {
        let base_path = config
            .data_dir
            .clone()
            .unwrap_or_else(|| std::path::PathBuf::from("."));
        let identity = load_or_create_identity(&config, &base_path).unwrap_or_else(|e| {
            eprintln!("Failed to initialise node identity: {}", e);
            std::process::exit(1);
        });
        println!("VALIDATOR_PUBKEY={}", hex::encode(&identity.validator_pubkey));
        println!("WALLET_ADDRESS={}", hex::encode(&identity.wallet_address));
        println!("DATA_DIR={}", base_path.display());
        return;
    }

    // Refuse to start on a genesis that was never finalised, before touching
    // the data directory. Without this the node panics deep inside startup and
    // Docker restart-loops on a config mistake.
    if let Err(e) = config.genesis.validate() {
        eprintln!("FATAL: {}", e);
        std::process::exit(1);
    }

    // 4. Initialize Metrics
    // Base Metrics Port = 9090 + (Node Port - 9000)
    // Node 9000 -> Metrics 9090
    // Node 9001 -> Metrics 9091
    let metrics_port = 9090u16.saturating_add(config.network.port.saturating_sub(9000));

    let builder = metrics_exporter_prometheus::PrometheusBuilder::new();
    builder
        .with_http_listener(
            std::net::SocketAddr::new(
                std::net::IpAddr::V4(std::net::Ipv4Addr::new(0, 0, 0, 0)),
                metrics_port
            )
        )
        .install()
        .expect("Failed to install Prometheus recorder");

    tracing::info!("Metrics exporter listening on port {}", metrics_port);

    tracing::info!("Starting node with config: {:?}", config);
    tracing::info!("----------------------------------------");

    let node = Node::new(config);
    node.run().await;
}
