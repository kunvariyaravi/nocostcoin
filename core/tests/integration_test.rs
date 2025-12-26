use nocostcoin::config::{AppConfig, NetworkConfig, GenesisConfig, MiningConfig};
use nocostcoin::node::Node;
use std::time::Duration;
use tempfile::tempdir;
use tokio::time::sleep;

// Helper to make a simple HTTP GET request to the API
async fn get_node_height(port: u16) -> Option<u64> {
    let url = format!("http://127.0.0.1:{}/stats", port);
    // We don't have reqwest, so we use a simple generic http request via TcpStream?
    // Or we can rely on the fact that we are in strict cargo test
    // Actually, writing a raw HTTP GET via TcpStream is robust enough for a simple test.
    
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::TcpStream;

    let addr = format!("127.0.0.1:{}", port);
    if let Ok(mut stream) = TcpStream::connect(addr).await {
        let request = format!("GET /stats HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n");
        if stream.write_all(request.as_bytes()).await.is_ok() {
            let mut response = Vec::new();
            if stream.read_to_end(&mut response).await.is_ok() {
                let response_str = String::from_utf8_lossy(&response);
                // Simple parsing to find the body
                if let Some(body_start) = response_str.find("\r\n\r\n") {
                    let body = &response_str[body_start + 4..];
                    // Parse JSON? "height": 123
                    if let Some(height_idx) = body.find("\"height\":") {
                        let rest = &body[height_idx + 9..];
                        // Find next comma or closing brace
                        let end = rest.find(|c: char| !c.is_numeric()).unwrap_or(rest.len());
                        let height_str = &rest[..end].trim();
                        return height_str.parse::<u64>().ok();
                    }
                }
            }
        }
    }
    None
}

#[tokio::test]
async fn test_multi_node_consensus() {
    // 1. Setup Configuration
    let n1_port = 11000;
    let n2_port = 11001;
    let n3_port = 11002;
    
    // API ports are port - 1000
    let n1_api = 10000;
    
    let dir1 = tempdir().unwrap();
    let dir2 = tempdir().unwrap();
    let dir3 = tempdir().unwrap();

    let genesis_time = chrono::Utc::now().timestamp_millis();
    let genesis_seed = "integration_test_genesis_seed".to_string();
    
    // Pre-generate configs
    let mut config1 = AppConfig::default_devnet(n1_port);
    config1.genesis.genesis_time = genesis_time;
    config1.genesis.genesis_seed = genesis_seed.clone();
    config1.mining.validator_seed = Some("node1_seed".to_string());
    config1.data_dir = Some(dir1.path().to_path_buf());
    // Initial validators must function for consensus
    config1.genesis.initial_validators = vec![
        "node1_seed".to_string(),
        "node2_seed".to_string(),
        "node3_seed".to_string(),
    ];

    let mut config2 = config1.clone();
    config2.network.port = n2_port;
    config2.network.listen_addr = format!("/ip4/127.0.0.1/tcp/{}", n2_port);
    config2.mining.validator_seed = Some("node2_seed".to_string());
    config2.data_dir = Some(dir2.path().to_path_buf());
    // Connect to Node 1
    config2.network.bootstrap_peers = vec![format!("/ip4/127.0.0.1/tcp/{}", n1_port)];

    let mut config3 = config1.clone();
    config3.network.port = n3_port;
    config3.network.listen_addr = format!("/ip4/127.0.0.1/tcp/{}", n3_port);
    config3.mining.validator_seed = Some("node3_seed".to_string());
    config3.data_dir = Some(dir3.path().to_path_buf());
    // Connect to Node 1
    config3.network.bootstrap_peers = vec![format!("/ip4/127.0.0.1/tcp/{}", n1_port)];

    // 2. Spawn Nodes
    println!("Spawning Node 1...");
    let node1 = Node::new(config1);
    tokio::spawn(async move {
        node1.run().await;
    });
    
    sleep(Duration::from_secs(2)).await;

    println!("Spawning Node 2...");
    let node2 = Node::new(config2);
    tokio::spawn(async move {
        node2.run().await;
    });

    println!("Spawning Node 3...");
    let node3 = Node::new(config3);
    tokio::spawn(async move {
        node3.run().await;
    });

    // 3. Wait/Poll for Consensus
    println!("Waiting for consensus...");
    let mut initial_height = 0;
    
    // Wait for nodes to start API
    sleep(Duration::from_secs(5)).await;
    
    if let Some(h) = get_node_height(n1_api).await {
        println!("Node 1 Initial Height: {}", h);
        initial_height = h;
    } else {
        println!("Failed to query Node 1");
    }

    // Run for 15 seconds (approx 7-8 blocks)
    sleep(Duration::from_secs(15)).await;

    let mut final_height = 0;
    if let Some(h) = get_node_height(n1_api).await {
        println!("Node 1 Final Height: {}", h);
        final_height = h;
    }

    // 4. Verification
    assert!(final_height > initial_height, "Blockchain failed to progress! Initial: {}, Final: {}", initial_height, final_height);
    assert!(final_height > 2, "Blockchain produced too few blocks!");
    
    println!("Integration Test Passed! Produced {} blocks.", final_height);
}
