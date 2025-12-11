use libp2p::{
    gossipsub, kad,
    mdns,
    noise,
    request_response::{self, ProtocolSupport},
    swarm::{NetworkBehaviour, SwarmEvent},
    tcp, yamux, PeerId, Swarm, Transport, StreamProtocol,
};
use serde::{Deserialize, Serialize};
use std::collections::hash_map::DefaultHasher;
use std::error::Error;
use std::hash::{Hash, Hasher};
use std::time::Duration;
use tokio::sync::mpsc;
use futures::StreamExt;

use crate::block::Block;
use crate::vote;
use crate::transaction::Transaction;

/// Direct Sync Request
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SyncRequest {
    GetBlocks { start_hash: String, limit: usize },
    GetChainInfo,
}

/// Direct Sync Response
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SyncResponse {
    Blocks { blocks: Vec<Block> },
    ChainInfo {
        head_hash: String,
        height: u64,
    },
}

/// Network message types (Gossip only)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkMessage {
    NewBlock(Block),
    NewTransaction(Transaction),
    Vote(vote::Vote),
}

/// Network configuration
#[derive(Debug, Clone)]
pub struct NetworkConfig {
    pub listen_addr: String,
    pub bootstrap_peers: Vec<String>,
}

impl Default for NetworkConfig {
    fn default() -> Self {
        Self {
            listen_addr: "/ip4/0.0.0.0/tcp/9000".to_string(),
            bootstrap_peers: vec![],
        }
    }
}

/// Network behavior combining Gossipsub, Kademlia, and mDNS
#[derive(NetworkBehaviour)]
pub struct NocostcoinBehaviour {
    pub gossipsub: gossipsub::Behaviour,
    pub kademlia: kad::Behaviour<kad::store::MemoryStore>,
    pub mdns: mdns::tokio::Behaviour,
    pub request_response: request_response::cbor::Behaviour<SyncRequest, SyncResponse>,
}

/// Network commands for controlling the node
#[derive(Debug)]
pub enum NetworkCommand {
    BroadcastBlock(Block),
    BroadcastTransaction(Transaction),
    BroadcastVote(vote::Vote),
    RequestBlocks { peer_id: PeerId, start_hash: String, limit: usize },
    RequestChainInfo(PeerId),
    SendResponse { channel: request_response::ResponseChannel<SyncResponse>, response: SyncResponse },
}

/// Client for interacting with the network node
#[derive(Clone)]
pub struct NetworkClient {
    cmd_tx: mpsc::UnboundedSender<NetworkCommand>,
}

impl NetworkClient {
    pub fn broadcast_block(&self, block: Block) {
        let _ = self.cmd_tx.send(NetworkCommand::BroadcastBlock(block));
    }

    pub fn broadcast_transaction(&self, tx: Transaction) {
        let _ = self.cmd_tx.send(NetworkCommand::BroadcastTransaction(tx));
    }

    pub fn broadcast_vote(&self, vote: vote::Vote) {
        let _ = self.cmd_tx.send(NetworkCommand::BroadcastVote(vote));
    }

    pub fn request_chain_info(&self, peer_id: PeerId) {
        let _ = self.cmd_tx.send(NetworkCommand::RequestChainInfo(peer_id));
    }

    pub fn request_blocks(&self, peer_id: PeerId, start_hash: String, limit: usize) {
        let _ = self.cmd_tx.send(NetworkCommand::RequestBlocks { peer_id, start_hash, limit });
    }

    pub fn send_response(&self, channel: request_response::ResponseChannel<SyncResponse>, response: SyncResponse) {
        let _ = self.cmd_tx.send(NetworkCommand::SendResponse { channel, response });
    }
}

/// Sync message types
#[derive(Debug)]
pub enum SyncMessage {
    // Responses received
    ChainInfo { peer_id: PeerId, height: u64, #[allow(dead_code)] head_hash: String },
    Blocks { peer_id: PeerId, blocks: Vec<Block> },
    
    // Incoming Requests
    IncomingRequest { 
        peer_id: PeerId, 
        request: SyncRequest, 
        channel: request_response::ResponseChannel<SyncResponse> 
    },
    
    PeerConnected { peer_id: PeerId },
    PeerDisconnected { peer_id: PeerId },
}

/// Network node managing P2P connections
pub struct NetworkNode {
    swarm: Swarm<NocostcoinBehaviour>,
    block_tx: mpsc::UnboundedSender<Block>,
    transaction_tx: mpsc::UnboundedSender<Transaction>,
    vote_tx: mpsc::UnboundedSender<vote::Vote>,
    sync_tx: mpsc::UnboundedSender<SyncMessage>,
    cmd_rx: mpsc::UnboundedReceiver<NetworkCommand>,
}

impl NetworkNode {
    /// Create a new network node
    pub async fn new(
        config: NetworkConfig,
        block_tx: mpsc::UnboundedSender<Block>,
        transaction_tx: mpsc::UnboundedSender<Transaction>,
        vote_tx: mpsc::UnboundedSender<vote::Vote>,
        sync_tx: mpsc::UnboundedSender<SyncMessage>,
    ) -> Result<(Self, NetworkClient), Box<dyn Error>> {
        // Generate a random peer ID
        let local_key = libp2p::identity::Keypair::generate_ed25519();
        let local_peer_id = PeerId::from(local_key.public());
        println!("Local peer id: {}", local_peer_id);

        // Set up transport with noise encryption and yamux multiplexing
        let transport = tcp::tokio::Transport::new(tcp::Config::default().nodelay(true))
            .upgrade(libp2p::core::upgrade::Version::V1)
            .authenticate(noise::Config::new(&local_key)?)
            .multiplex(yamux::Config::default())
            .boxed();

        // Configure Gossipsub
        let message_id_fn = |message: &gossipsub::Message| {
            let mut s = DefaultHasher::new();
            message.data.hash(&mut s);
            gossipsub::MessageId::from(s.finish().to_string())
        };

        let gossipsub_config = gossipsub::ConfigBuilder::default()
            .heartbeat_interval(Duration::from_secs(1))
            .validation_mode(gossipsub::ValidationMode::Strict)
            .message_id_fn(message_id_fn)
            .build()
            .expect("Valid gossipsub config");

        let mut gossipsub = gossipsub::Behaviour::new(
            gossipsub::MessageAuthenticity::Signed(local_key.clone()),
            gossipsub_config,
        )?;

        // Subscribe to topics
        let block_topic = gossipsub::IdentTopic::new("nocostcoin-blocks");
        let tx_topic = gossipsub::IdentTopic::new("nocostcoin-transactions");
        let vote_topic = gossipsub::IdentTopic::new("nocostcoin-votes");
        gossipsub.subscribe(&block_topic)?;
        gossipsub.subscribe(&tx_topic)?;
        gossipsub.subscribe(&vote_topic)?;

        // Configure Request-Response
        let request_response = request_response::cbor::Behaviour::new(
            [(
                StreamProtocol::new("/nocostcoin/sync/1.0.0"),
                ProtocolSupport::Full,
            )],
            request_response::Config::default(),
        );

        // Configure Kademlia DHT
        let mut kademlia = kad::Behaviour::new(
            local_peer_id,
            kad::store::MemoryStore::new(local_peer_id),
        );

        // Add bootstrap peers to Kademlia
        for peer_addr in &config.bootstrap_peers {
            if let Ok(addr) = peer_addr.parse() {
                kademlia.add_address(&local_peer_id, addr);
            }
        }

        // Configure mDNS for local peer discovery
        let mdns = mdns::tokio::Behaviour::new(
            mdns::Config::default(),
            local_peer_id,
        )?;

        // Create the network behaviour
        let behaviour = NocostcoinBehaviour {
            gossipsub,
            kademlia,
            mdns,
            request_response,
        };

        // Create the swarm
        let mut swarm = Swarm::new(
            transport,
            behaviour,
            local_peer_id,
            libp2p::swarm::Config::with_tokio_executor(),
        );

        // Listen on the configured address
        swarm.listen_on(config.listen_addr.parse()?)?;

        // Create command channel
        let (cmd_tx, cmd_rx) = mpsc::unbounded_channel();

        Ok((
            Self {
                swarm,
                block_tx,
                transaction_tx,
                vote_tx,
                sync_tx,
                cmd_rx,
            },
            NetworkClient { cmd_tx },
        ))
    }

    /// Run the network event loop
    pub async fn run(&mut self) {
        loop {
            tokio::select! {
                event = self.swarm.select_next_some() => {
                    match event {
                        SwarmEvent::Behaviour(event) => {
                            self.handle_behaviour_event(event).await;
                        }
                        SwarmEvent::NewListenAddr { address, .. } => {
                            println!("Listening on {}", address);
                        }
                        SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                            println!("Connected to peer: {}", peer_id);
                            let _ = self.sync_tx.send(SyncMessage::PeerConnected { peer_id });
                        }
                        SwarmEvent::ConnectionClosed { peer_id, cause, .. } => {
                            println!("Connection closed with {}: {:?}", peer_id, cause);
                            let _ = self.sync_tx.send(SyncMessage::PeerDisconnected { peer_id });
                        }
                        _ => {}
                    }
                }
                cmd = self.cmd_rx.recv() => {
                    if let Some(command) = cmd {
                        self.handle_command(command);
                    } else {
                        break; // Channel closed
                    }
                }
            }
        }
    }

    fn handle_command(&mut self, command: NetworkCommand) {
        match command {
            NetworkCommand::BroadcastBlock(block) => {
                if let Ok(data) = bincode::serialize(&NetworkMessage::NewBlock(block)) {
                    let topic = gossipsub::IdentTopic::new("nocostcoin-blocks");
                    if let Err(e) = self.swarm.behaviour_mut().gossipsub.publish(topic, data) {
                        eprintln!("Failed to publish block: {}", e);
                    }
                }
            }
            NetworkCommand::BroadcastTransaction(tx) => {
                if let Ok(data) = bincode::serialize(&NetworkMessage::NewTransaction(tx)) {
                    let topic = gossipsub::IdentTopic::new("nocostcoin-transactions");
                    if let Err(e) = self.swarm.behaviour_mut().gossipsub.publish(topic, data) {
                        eprintln!("Failed to publish transaction: {}", e);
                    }
                }
            }
            NetworkCommand::BroadcastVote(vote) => {
                if let Ok(data) = bincode::serialize(&NetworkMessage::Vote(vote)) {
                    let topic = gossipsub::IdentTopic::new("nocostcoin-votes");
                    if let Err(e) = self.swarm.behaviour_mut().gossipsub.publish(topic, data) {
                        eprintln!("Failed to publish vote: {}", e);
                    }
                }
            }
            NetworkCommand::RequestChainInfo(peer_id) => {
                self.swarm.behaviour_mut().request_response.send_request(&peer_id, SyncRequest::GetChainInfo);
            }
            NetworkCommand::RequestBlocks { peer_id, start_hash, limit } => {
                self.swarm.behaviour_mut().request_response.send_request(&peer_id, SyncRequest::GetBlocks { start_hash, limit });
            }
            NetworkCommand::SendResponse { channel, response } => {
                if let Err(_) = self.swarm.behaviour_mut().request_response.send_response(channel, response) {
                    eprintln!("Failed to send response: (connection closed)");
                }
            }
        }
    }

    /// Handle network behaviour events
    async fn handle_behaviour_event(&mut self, event: NocostcoinBehaviourEvent) {
        match event {
            NocostcoinBehaviourEvent::Gossipsub(gossipsub::Event::Message {
                propagation_source: _,
                message_id: _,
                message,
            }) => {
                self.handle_gossipsub_message(message).await;
            }
            NocostcoinBehaviourEvent::RequestResponse(request_response::Event::Message { message, peer, .. }) => {
                match message {
                    request_response::Message::Request { request, channel, .. } => {
                        let _ = self.sync_tx.send(SyncMessage::IncomingRequest { 
                            peer_id: peer, 
                            request, 
                            channel 
                        });
                    }
                    request_response::Message::Response { response, .. } => {
                        match response {
                            SyncResponse::Blocks { blocks } => {
                                let _ = self.sync_tx.send(SyncMessage::Blocks { peer_id: peer, blocks });
                            }
                            SyncResponse::ChainInfo { height, head_hash } => {
                                let _ = self.sync_tx.send(SyncMessage::ChainInfo { peer_id: peer, height, head_hash });
                            }
                        }
                    }
                }
            }
            NocostcoinBehaviourEvent::Mdns(mdns::Event::Discovered(list)) => {
                for (peer_id, multiaddr) in list {
                    println!("Discovered peer {} at {}", peer_id, multiaddr);
                    self.swarm.behaviour_mut().gossipsub.add_explicit_peer(&peer_id);
                    self.swarm.behaviour_mut().kademlia.add_address(&peer_id, multiaddr);
                }
            }
            NocostcoinBehaviourEvent::Mdns(mdns::Event::Expired(list)) => {
                for (peer_id, multiaddr) in list {
                    println!("Peer {} at {} expired", peer_id, multiaddr);
                    self.swarm.behaviour_mut().gossipsub.remove_explicit_peer(&peer_id);
                }
            }
            NocostcoinBehaviourEvent::Kademlia(kad::Event::RoutingUpdated {
                peer,
                addresses,
                ..
            }) => {
                println!("Routing updated for peer {}: {:?}", peer, addresses);
            }
            _ => {}
        }
    }

    /// Handle incoming gossipsub messages
    async fn handle_gossipsub_message(&mut self, message: gossipsub::Message) {
        if let Ok(network_msg) = bincode::deserialize::<NetworkMessage>(&message.data) {
            match network_msg {
                NetworkMessage::NewBlock(block) => {
                    println!("Received new block: {}", block.hash);
                    if let Err(e) = self.block_tx.send(block) {
                        eprintln!("Failed to forward block to chain: {}", e);
                    }
                }
                NetworkMessage::NewTransaction(tx) => {
                    println!("Received new transaction");
                    if let Err(e) = self.transaction_tx.send(tx) {
                        eprintln!("Failed to forward transaction to chain: {}", e);
                    }
                }
                NetworkMessage::Vote(vote) => {
                    // println!("Received vote for block {}", vote.block_hash);
                    if let Err(e) = self.vote_tx.send(vote) {
                        eprintln!("Failed to forward vote to chain: {}", e);
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_network_message_serialization() {
        use crate::block::{Block, BlockHeader};

        let header = BlockHeader {
            parent_hash: "0".to_string(),
            slot: 0,
            epoch: 0,
            vrf_output: vec![1, 2, 3],
            vrf_proof: vec![4, 5, 6],
            validator_pubkey: vec![7, 8, 9],
            producer_signature: vec![],
            state_root: "".to_string(),
            tx_root: "".to_string(),
            extra_witnesses: vec![],
            timestamp: 0,
        };

        let block = Block::new(header, vec![]);
        let msg = NetworkMessage::NewBlock(block.clone());

        let serialized = bincode::serialize(&msg).unwrap();
        let deserialized: NetworkMessage = bincode::deserialize(&serialized).unwrap();

        match deserialized {
            NetworkMessage::NewBlock(b) => assert_eq!(b.hash, block.hash),
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_default_config() {
        let config = NetworkConfig::default();
        assert_eq!(config.listen_addr, "/ip4/0.0.0.0/tcp/9000");
        assert!(config.bootstrap_peers.is_empty());
    }
}
