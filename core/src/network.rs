use libp2p::{
    gossipsub, kad,
    mdns,
    noise,
    identify,
    ping,
    autonat,
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
use metrics::{gauge, counter};
use tracing::{info, error, warn};

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
    pub identify: identify::Behaviour,
    pub ping: ping::Behaviour,
    pub autonat: autonat::Behaviour,
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
    // Peer Identified
    PeerIdentified {
        peer_id: PeerId,
        protocol: String,
        address: String,
    },
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
        info!("Local peer id: {}", local_peer_id);

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
        let block_topic = gossipsub::IdentTopic::new("nocostcoin/blocks/1.0.0");
        let tx_topic = gossipsub::IdentTopic::new("nocostcoin/txs/1.0.0");
        let vote_topic = gossipsub::IdentTopic::new("nocostcoin/votes/1.0.0");
        gossipsub.subscribe(&block_topic)?;
        gossipsub.subscribe(&tx_topic)?;
        gossipsub.subscribe(&vote_topic)?;

        // Configure Request-Response
        let req_resp = request_response::cbor::Behaviour::new(
            [(
                StreamProtocol::new("/nocostcoin/sync/1.0.0"),
                ProtocolSupport::Full,
            )],
            request_response::Config::default(),
        );

        // Configure Kademlia DHT
        let kademlia = kad::Behaviour::new(
            local_peer_id,
            kad::store::MemoryStore::new(local_peer_id),
        );

        // Configure mDNS for local peer discovery
        let mdns = mdns::tokio::Behaviour::new(
            mdns::Config::default(),
            local_peer_id,
        )?;

        // Configure Identify
        let identify = identify::Behaviour::new(identify::Config::new(
            "/nocostcoin/1.0.0".to_string(),
            local_key.public(),
        ));

        // Configure Ping
        let ping = ping::Behaviour::new(ping::Config::new());

        // Configure AutoNAT
        let autonat = autonat::Behaviour::new(
            local_peer_id,
            autonat::Config::default(),
        );

        // Create the network behaviour
        let behaviour = NocostcoinBehaviour {
            gossipsub,
            kademlia,
            mdns,
            request_response: req_resp,
            identify,
            ping,
            autonat,
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

        // Dial bootstrap peers
        for peer_addr_str in &config.bootstrap_peers {
            if let Ok(addr) = peer_addr_str.parse::<libp2p::Multiaddr>() {
                info!("Dialing bootstrap peer: {}", addr);
                if let Err(e) = swarm.dial(addr.clone()) {
                    warn!("Failed to dial bootstrap peer {}: {}", addr, e);
                }
            }
        }

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
                            info!("Listening on {}", address);
                        }
                        SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                            info!("Connected to peer: {}", peer_id);
                            // gauge!("connected_peers").increment(1.0);
                            let _ = self.sync_tx.send(SyncMessage::PeerConnected { peer_id });
                        }
                        SwarmEvent::ConnectionClosed { peer_id, cause, .. } => {
                            info!("Connection closed with {}: {:?}", peer_id, cause);
                            // gauge!("connected_peers").decrement(1.0);
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
                    let topic = gossipsub::IdentTopic::new("nocostcoin/blocks/1.0.0");
                    if let Err(e) = self.swarm.behaviour_mut().gossipsub.publish(topic, data) {
                        error!("Failed to publish block: {}", e);
                    }
                }
            }
            NetworkCommand::BroadcastTransaction(tx) => {
                if let Ok(data) = bincode::serialize(&NetworkMessage::NewTransaction(tx)) {
                    let topic = gossipsub::IdentTopic::new("nocostcoin/txs/1.0.0");
                    if let Err(e) = self.swarm.behaviour_mut().gossipsub.publish(topic, data) {
                        error!("Failed to publish transaction: {}", e);
                    }
                }
            }
            NetworkCommand::BroadcastVote(vote) => {
                if let Ok(data) = bincode::serialize(&NetworkMessage::Vote(vote)) {
                    let topic = gossipsub::IdentTopic::new("nocostcoin/votes/1.0.0");
                    if let Err(e) = self.swarm.behaviour_mut().gossipsub.publish(topic, data) {
                        error!("Failed to publish vote: {}", e);
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
                    warn!("Failed to send response: (connection closed)");
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
                    info!("Discovered peer {} at {}", peer_id, multiaddr);
                    self.swarm.behaviour_mut().gossipsub.add_explicit_peer(&peer_id);
                    self.swarm.behaviour_mut().kademlia.add_address(&peer_id, multiaddr);
                }
            }
            NocostcoinBehaviourEvent::Mdns(mdns::Event::Expired(list)) => {
                for (peer_id, multiaddr) in list {
                    info!("Peer {} at {} expired", peer_id, multiaddr);
                    self.swarm.behaviour_mut().gossipsub.remove_explicit_peer(&peer_id);
                }
            }
            NocostcoinBehaviourEvent::Kademlia(kad::Event::RoutingUpdated {
                peer,
                addresses: _addresses,
                ..
            }) => {
                // debug!("Routing updated for peer {}: {:?}", peer, addresses);
            }
            NocostcoinBehaviourEvent::Identify(identify::Event::Received { peer_id, info, .. }) => {
                info!("Identified peer {}: {:?} (Protocol: {:?})", peer_id, info.agent_version, info.protocol_version);
                // Add identified address to Kademlia
                 for addr in info.listen_addrs.iter() {
                    self.swarm.behaviour_mut().kademlia.add_address(&peer_id, addr.clone());
                }
                
                // Notify application
                if let Some(addr) = info.listen_addrs.first() {
                    let _ = self.sync_tx.send(SyncMessage::PeerIdentified { 
                        peer_id, 
                        protocol: info.protocol_version, 
                        address: addr.to_string() 
                    });
                }
            }
            NocostcoinBehaviourEvent::Ping(ping::Event { peer, result, .. }) => {
                // Optional: log ping success/failure
                 if let Err(e) = result {
                    warn!("Ping failure with {}: {:?}", peer, e);
                 }
            }
            NocostcoinBehaviourEvent::Autonat(autonat::Event::StatusChanged { old, new }) => {
                 info!("AutoNAT status changed: {:?} -> {:?}", old, new);
            }
            _ => {}
        }
    }

    /// Handle incoming gossipsub messages
    async fn handle_gossipsub_message(&mut self, message: gossipsub::Message) {
        if let Ok(network_msg) = bincode::deserialize::<NetworkMessage>(&message.data) {
            match network_msg {
                NetworkMessage::NewBlock(block) => {
                    info!("Received new block: {}", block.hash);
                    // counter!("messages_received", "type" => "block").increment(1);
                    if let Err(e) = self.block_tx.send(block) {
                        error!("Failed to forward block to chain: {}", e);
                    }
                }
                NetworkMessage::NewTransaction(tx) => {
                    info!("Received new transaction");
                    // counter!("messages_received", "type" => "tx").increment(1);
                    if let Err(e) = self.transaction_tx.send(tx) {
                        error!("Failed to forward transaction to chain: {}", e);
                    }
                }
                NetworkMessage::Vote(vote) => {
                    // debug!("Received vote for block {}", vote.block_hash);
                    // counter!("messages_received", "type" => "vote").increment(1);
                    if let Err(e) = self.vote_tx.send(vote) {
                        error!("Failed to forward vote to chain: {}", e);
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use libp2p::gossipsub;
    use std::time::Duration;

    #[tokio::test]
    async fn test_gossipsub_init() {
        let config = NetworkConfig {
            listen_addr: "/ip4/127.0.0.1/tcp/0".to_string(), // OS assigns random port
            bootstrap_peers: vec![],
        };
        
        // Mock channels
        let (block_tx, _) = mpsc::unbounded_channel();
        let (tx_tx, _) = mpsc::unbounded_channel();
        let (vote_tx, _) = mpsc::unbounded_channel();
        let (sync_tx, _) = mpsc::unbounded_channel();

        let result = NetworkNode::new(config, block_tx, tx_tx, vote_tx, sync_tx).await;
        assert!(result.is_ok(), "NetworkNode should initialize correctly with Gossipsub");
    }
}
