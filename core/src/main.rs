mod block;
mod crypto;
mod transaction;
mod consensus;
mod chain;
mod state;
mod validator;
mod storage;
mod network;
mod mempool;
mod sync;
mod wallet;
mod vote;
mod trie;
mod api;
mod node;

use crate::node::{Node, NodeConfig};

#[tokio::main]
async fn main() {
    println!("Starting Nocostcoin Node...");

    // Parse command-line arguments
    let args: Vec<String> = std::env::args().collect();
    let mut port = 9000;
    let mut bootstrap_peers = vec![];

    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--port" => {
                if i + 1 < args.len() {
                    port = args[i + 1].parse().unwrap_or(9000);
                    i += 2;
                } else {
                    i += 1;
                }
            }
            "--bootstrap" => {
                if i + 1 < args.len() {
                    bootstrap_peers.push(args[i + 1].clone());
                    i += 2;
                } else {
                    i += 1;
                }
            }
            _ => i += 1,
        }
    }

    let config = NodeConfig {
        port,
        bootstrap_peers,
    };

    let node = Node::new(config);
    node.run().await;
}
