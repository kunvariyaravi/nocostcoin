use nocostcoin::node::Node;
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

    /// Override bootstrap peers (comma separated)
    #[arg(long)]
    bootstrap: Option<String>,
    
    /// Enable/Disable mining
    #[arg(long)]
    mining: Option<bool>,
}

#[tokio::main]
async fn main() {
    // Initialize structured logging
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let args = Args::parse();
    
    // Calculate metrics port based on node port override or default
    // This is a bit tricky since we load config later, but let's try a best effort default base 9100.
    // Ideally we'd read this from config, but for now let's just pick a port.
    // Or we bind to 9100 + offset if running multiple nodes?
    // Let's keep it simple: bind to 0.0.0.0:9100 for now, or just let it fail if port release.
    // Better: let's pick 9100 as base and ideally augment it.
    
    // For simplicity in this iteration:
    let builder = metrics_exporter_prometheus::PrometheusBuilder::new();
    // We need to route the metrics endpoint via our API or a separate listener.
    // The builder.install() spawns a listener on 0.0.0.0:9000 by default which conflicts with P2P!
    // We MUST specify a port.
    // Let's infer it from the args if possible, or bind to a range.
    
    // FIX: Let's read the port from args/config first.
    // Moving config loading up.

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
        config.network.port = port;
        config.network.listen_addr = format!("/ip4/127.0.0.1/tcp/{}", port);
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

    // 3. Initialize Metrics
    // Base Metrics Port = 9090 + (Node Port - 9000)
    // Node 9000 -> Metrics 9090
    // Node 9001 -> Metrics 9091
    let metrics_port = 9090 + (config.network.port - 9000);
    
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
