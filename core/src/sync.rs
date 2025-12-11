use crate::block::Block;
use crate::chain::Chain;
use libp2p::PeerId;
use std::collections::HashMap;
use tokio::sync::mpsc;

/// Synchronization state
#[derive(Debug, Clone, PartialEq)]
pub enum SyncState {
    Idle,
    Syncing { peer: PeerId, target_height: u64 },
    Synced,
}

/// Sync events sent to the application
#[derive(Debug, Clone)]
pub enum SyncEvent {
    SyncStarted { peer: PeerId, target_height: u64 },
    SyncProgress { current_height: u64, target_height: u64 },
    SyncCompleted,
    SyncFailed { reason: String },
}

/// Manages blockchain synchronization with peers
pub struct SyncManager {
    state: SyncState,
    peer_heights: HashMap<PeerId, u64>,
    event_tx: mpsc::UnboundedSender<SyncEvent>,
}

impl SyncManager {
    pub fn new(event_tx: mpsc::UnboundedSender<SyncEvent>) -> Self {
        Self {
            state: SyncState::Idle,
            peer_heights: HashMap::new(),
            event_tx,
        }
    }

    /// Update peer's chain info
    pub fn update_peer_info(&mut self, peer: PeerId, height: u64) {
        self.peer_heights.insert(peer, height);
    }

    /// Check if we need to sync based on our height vs peers
    pub fn should_sync(&self, our_height: u64) -> Option<(PeerId, u64)> {
        if self.state != SyncState::Idle {
            return None;
        }

        // Find the peer with the highest chain
        self.peer_heights
            .iter()
            .filter(|&(_, &height)| height > our_height)
            .max_by_key(|&(_, &height)| height)
            .map(|(peer, &height)| (*peer, height))
    }

    /// Start syncing with a peer
    pub fn start_sync(&mut self, peer: PeerId, target_height: u64) {
        self.state = SyncState::Syncing { peer, target_height };
        let _ = self.event_tx.send(SyncEvent::SyncStarted { peer, target_height });
    }

    /// Process received blocks during sync
    pub fn process_blocks(&mut self, blocks: Vec<Block>, chain: &mut Chain) -> Result<(), String> {
        let mut added_count = 0;
        
        for block in blocks {
            let block_hash = block.hash.clone();
            if chain.add_block(block) {
                added_count += 1;
            } else {
                // If we fail to add a block, it might be because we already have it or it's invalid.
                // For now, we'll log it but continue if possible, or fail if it breaks the chain.
                // In a strict sync, we might want to fail immediately.
                // However, duplicate blocks are harmless.
                // Let's check if we already have it.
                if chain.get_block(&block_hash).is_some() {
                    continue;
                }
                return Err(format!("Failed to add block during sync: {}", block_hash));
            }
        }

        if added_count > 0 {
            if let SyncState::Syncing { peer: _, target_height } = self.state {
                let current_height = chain.get_height();
                let _ = self.event_tx.send(SyncEvent::SyncProgress {
                    current_height,
                    target_height,
                });

                // Check if we're done syncing
                if current_height >= target_height {
                    self.complete_sync();
                } else {
                    // Request more blocks
                    // We need to request from the next block after our current head
                    // This logic should ideally be triggered by the main loop or here via an event
                    // For now, we'll rely on the main loop to request the next batch
                }
            }
        }

        Ok(())
    }

    /// Get the next batch of blocks to request
    #[allow(dead_code)]
    pub fn get_next_request(&self, current_height: u64) -> Option<(PeerId, String, usize)> {
        if let SyncState::Syncing { peer: _, target_height } = self.state {
            if current_height < target_height {
                // We need to find the hash of our current head to request the next blocks
                // But the request format is (start_hash, limit).
                // If we request start_hash, the peer sends blocks STARTING from that hash.
                // So we should pass our current head hash.
                // The caller needs to provide the head hash.
                return None; // Caller needs to provide head hash, so we need a different signature or approach
            }
        }
        None
    }

    /// Mark sync as completed
    pub fn complete_sync(&mut self) {
        self.state = SyncState::Synced;
        let _ = self.event_tx.send(SyncEvent::SyncCompleted);
    }

    /// Mark sync as failed
    pub fn fail_sync(&mut self, reason: String) {
        self.state = SyncState::Idle;
        let _ = self.event_tx.send(SyncEvent::SyncFailed { reason });
    }

    /// Check if currently syncing
    pub fn is_syncing(&self) -> bool {
        matches!(self.state, SyncState::Syncing { .. })
    }

    /// Check if synced
    #[allow(dead_code)]
    pub fn is_synced(&self) -> bool {
        self.state == SyncState::Synced
    }

    /// Get current sync state
    pub fn get_state(&self) -> &SyncState {
        &self.state
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sync_manager_creation() {
        let (tx, _rx) = mpsc::unbounded_channel();
        let manager = SyncManager::new(tx);
        assert_eq!(manager.state, SyncState::Idle);
        assert!(!manager.is_syncing());
        assert!(!manager.is_synced());
    }

    #[test]
    fn test_should_sync() {
        let (tx, _rx) = mpsc::unbounded_channel();
        let mut manager = SyncManager::new(tx);
        
        let peer1 = PeerId::random();
        let peer2 = PeerId::random();
        
        manager.update_peer_info(peer1, 10);
        manager.update_peer_info(peer2, 20);
        
        // Should sync with peer2 (highest chain)
        let result = manager.should_sync(5);
        assert!(result.is_some());
        let (peer, height) = result.unwrap();
        assert_eq!(peer, peer2);
        assert_eq!(height, 20);
        
        // Should not sync if we're already at the same height
        assert!(manager.should_sync(20).is_none());
    }
}
