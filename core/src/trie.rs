use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// Simplified Merkle Patricia Trie implementation
/// This is a basic MPT that stores key-value pairs and computes a merkle root

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Node {
    /// Leaf node: stores the actual value
    Leaf { key: Vec<u8>, value: Vec<u8> },
    /// Branch node: has up to 16 children (for hex nibbles) + optional value
    Branch { children: [Option<String>; 16], value: Option<Vec<u8>> },
    /// Extension node: compresses a common path
    Extension { path: Vec<u8>, child: String },
}

impl Node {
    fn hash(&self) -> String {
        let encoded = bincode::serialize(self).unwrap();
        let mut hasher = Sha256::new();
        hasher.update(&encoded);
        hex::encode(hasher.finalize())
    }
}

#[derive(Clone)]
pub struct MerklePatriciaTrie {
    /// In-memory cache of nodes
    nodes: HashMap<String, Node>,
    /// Root hash
    root: Option<String>,
}

impl MerklePatriciaTrie {
    pub fn new() -> Self {
        Self {
            nodes: HashMap::new(),
            root: None,
        }
    }

    /// Insert a key-value pair into the trie
    pub fn insert(&mut self, key: Vec<u8>, value: Vec<u8>) {
        let nibbles = Self::to_nibbles(&key);
        self.root = Some(self.insert_at(self.root.clone(), nibbles, value));
    }

    /// Get a value from the trie
    #[allow(dead_code)]
    pub fn get(&self, key: &[u8]) -> Option<Vec<u8>> {
        let nibbles = Self::to_nibbles(key);
        self.get_at(self.root.as_ref()?, nibbles)
    }

    /// Get the current root hash
    pub fn root(&self) -> String {
        self.root.clone().unwrap_or_else(|| String::from(""))
    }

    /// Convert bytes to nibbles (4-bit values)
    fn to_nibbles(bytes: &[u8]) -> Vec<u8> {
        let mut nibbles = Vec::with_capacity(bytes.len() * 2);
        for byte in bytes {
            nibbles.push(byte >> 4);
            nibbles.push(byte & 0x0F);
        }
        nibbles
    }

    /// Insert at a specific node
    fn insert_at(&mut self, node_hash: Option<String>, path: Vec<u8>, value: Vec<u8>) -> String {
        if path.is_empty() {
            // We've reached the end of the path
            let leaf = Node::Leaf { key: vec![], value };
            let hash = leaf.hash();
            self.nodes.insert(hash.clone(), leaf);
            return hash;
        }

        match node_hash {
            None => {
                // Create a new leaf
                let leaf = Node::Leaf { key: path, value };
                let hash = leaf.hash();
                self.nodes.insert(hash.clone(), leaf);
                hash
            }
            Some(hash) => {
                let node = self.nodes.get(&hash).cloned();
                match node {
                    Some(Node::Leaf { key: leaf_key, value: leaf_value }) => {
                        if leaf_key == path {
                            // Update existing leaf
                            let new_leaf = Node::Leaf { key: path, value };
                            let new_hash = new_leaf.hash();
                            self.nodes.insert(new_hash.clone(), new_leaf);
                            new_hash
                        } else {
                            // Split into branch
                            self.split_leaf(leaf_key, leaf_value, path, value)
                        }
                    }
                    Some(Node::Branch { mut children, value: branch_value }) => {
                        let nibble = path[0] as usize;
                        let rest = path[1..].to_vec();
                        
                        if rest.is_empty() {
                            // Insert value at this branch
                            let new_branch = Node::Branch { children, value: Some(value) };
                            let new_hash = new_branch.hash();
                            self.nodes.insert(new_hash.clone(), new_branch);
                            new_hash
                        } else {
                            // Recurse into child
                            let child_hash = self.insert_at(children[nibble].clone(), rest, value);
                            children[nibble] = Some(child_hash);
                            let new_branch = Node::Branch { children, value: branch_value };
                            let new_hash = new_branch.hash();
                            self.nodes.insert(new_hash.clone(), new_branch);
                            new_hash
                        }
                    }
                    Some(Node::Extension { path: ext_path, child }) => {
                        let common = Self::common_prefix(&ext_path, &path);
                        if common == ext_path.len() {
                            // Extension path is a prefix, continue into child
                            let rest = path[common..].to_vec();
                            let new_child = self.insert_at(Some(child), rest, value);
                            let new_ext = Node::Extension { path: ext_path, child: new_child };
                            let new_hash = new_ext.hash();
                            self.nodes.insert(new_hash.clone(), new_ext);
                            new_hash
                        } else {
                            // Need to split the extension
                            self.split_extension(ext_path, child, path, value, common)
                        }
                    }
                    None => {
                        // Node not found, create new leaf
                        let leaf = Node::Leaf { key: path, value };
                        let hash = leaf.hash();
                        self.nodes.insert(hash.clone(), leaf);
                        hash
                    }
                }
            }
        }
    }

    /// Get value at a specific node
    #[allow(dead_code)]
    fn get_at(&self, node_hash: &str, path: Vec<u8>) -> Option<Vec<u8>> {
        let node = self.nodes.get(node_hash)?;
        
        match node {
            Node::Leaf { key, value } => {
                if key == &path {
                    Some(value.clone())
                } else {
                    None
                }
            }
            Node::Branch { children, value } => {
                if path.is_empty() {
                    value.clone()
                } else {
                    let nibble = path[0] as usize;
                    let rest = path[1..].to_vec();
                    let child_hash = children[nibble].as_ref()?;
                    self.get_at(child_hash, rest)
                }
            }
            Node::Extension { path: ext_path, child } => {
                if path.starts_with(ext_path) {
                    let rest = path[ext_path.len()..].to_vec();
                    self.get_at(child, rest)
                } else {
                    None
                }
            }
        }
    }

    /// Split a leaf into a branch when inserting a conflicting key
    fn split_leaf(&mut self, leaf_key: Vec<u8>, leaf_value: Vec<u8>, new_key: Vec<u8>, new_value: Vec<u8>) -> String {
        let common = Self::common_prefix(&leaf_key, &new_key);
        
        // Create a branch at the divergence point
        let mut children: [Option<String>; 16] = Default::default();
        
        if common < leaf_key.len() {
            let leaf_nibble = leaf_key[common] as usize;
            let leaf_rest = leaf_key[common + 1..].to_vec();
            let leaf_hash = if leaf_rest.is_empty() {
                let leaf = Node::Leaf { key: vec![], value: leaf_value };
                let hash = leaf.hash();
                self.nodes.insert(hash.clone(), leaf);
                hash
            } else {
                let leaf = Node::Leaf { key: leaf_rest, value: leaf_value };
                let hash = leaf.hash();
                self.nodes.insert(hash.clone(), leaf);
                hash
            };
            children[leaf_nibble] = Some(leaf_hash);
        }
        
        if common < new_key.len() {
            let new_nibble = new_key[common] as usize;
            let new_rest = new_key[common + 1..].to_vec();
            let new_hash = if new_rest.is_empty() {
                let leaf = Node::Leaf { key: vec![], value: new_value };
                let hash = leaf.hash();
                self.nodes.insert(hash.clone(), leaf);
                hash
            } else {
                let leaf = Node::Leaf { key: new_rest, value: new_value };
                let hash = leaf.hash();
                self.nodes.insert(hash.clone(), leaf);
                hash
            };
            children[new_nibble] = Some(new_hash);
        }
        
        let branch = Node::Branch { children, value: None };
        let branch_hash = branch.hash();
        self.nodes.insert(branch_hash.clone(), branch);
        
        // If there's a common prefix, wrap in extension
        if common > 0 {
            let ext = Node::Extension { 
                path: leaf_key[..common].to_vec(), 
                child: branch_hash 
            };
            let ext_hash = ext.hash();
            self.nodes.insert(ext_hash.clone(), ext);
            ext_hash
        } else {
            branch_hash
        }
    }

    /// Split an extension node
    fn split_extension(&mut self, ext_path: Vec<u8>, ext_child: String, new_key: Vec<u8>, new_value: Vec<u8>, common: usize) -> String {
        let mut children: [Option<String>; 16] = Default::default();
        
        // Handle the old extension's remainder
        let ext_nibble = ext_path[common] as usize;
        let ext_rest = ext_path[common + 1..].to_vec();
        
        if ext_rest.is_empty() {
            children[ext_nibble] = Some(ext_child);
        } else {
            let new_ext = Node::Extension { path: ext_rest, child: ext_child };
            let new_ext_hash = new_ext.hash();
            self.nodes.insert(new_ext_hash.clone(), new_ext);
            children[ext_nibble] = Some(new_ext_hash);
        }
        
        // Handle the new key
        let new_nibble = new_key[common] as usize;
        let new_rest = new_key[common + 1..].to_vec();
        let new_hash = if new_rest.is_empty() {
            let leaf = Node::Leaf { key: vec![], value: new_value };
            let hash = leaf.hash();
            self.nodes.insert(hash.clone(), leaf);
            hash
        } else {
            let leaf = Node::Leaf { key: new_rest, value: new_value };
            let hash = leaf.hash();
            self.nodes.insert(hash.clone(), leaf);
            hash
        };
        children[new_nibble] = Some(new_hash);
        
        let branch = Node::Branch { children, value: None };
        let branch_hash = branch.hash();
        self.nodes.insert(branch_hash.clone(), branch);
        
        // Wrap in extension if there's a common prefix
        if common > 0 {
            let ext = Node::Extension { 
                path: ext_path[..common].to_vec(), 
                child: branch_hash 
            };
            let ext_hash = ext.hash();
            self.nodes.insert(ext_hash.clone(), ext);
            ext_hash
        } else {
            branch_hash
        }
    }

    /// Find common prefix length
    fn common_prefix(a: &[u8], b: &[u8]) -> usize {
        a.iter().zip(b.iter()).take_while(|(x, y)| x == y).count()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_insert_and_get() {
        let mut trie = MerklePatriciaTrie::new();
        
        let key1 = vec![1, 2, 3];
        let value1 = vec![10, 20, 30];
        
        trie.insert(key1.clone(), value1.clone());
        
        assert_eq!(trie.get(&key1), Some(value1));
        assert_eq!(trie.get(&[4, 5, 6]), None);
    }

    #[test]
    fn test_multiple_inserts() {
        let mut trie = MerklePatriciaTrie::new();
        
        trie.insert(vec![1, 2, 3], vec![100]);
        trie.insert(vec![1, 2, 4], vec![200]);
        trie.insert(vec![1, 3, 5], vec![44]);
        
        assert_eq!(trie.get(&[1, 2, 3]), Some(vec![100]));
        assert_eq!(trie.get(&[1, 2, 4]), Some(vec![200]));
        assert_eq!(trie.get(&[1, 3, 5]), Some(vec![44]));
    }

    #[test]
    fn test_root_changes() {
        let mut trie = MerklePatriciaTrie::new();
        
        let root1 = trie.root();
        
        trie.insert(vec![1, 2, 3], vec![100]);
        let root2 = trie.root();
        
        trie.insert(vec![1, 2, 4], vec![200]);
        let root3 = trie.root();
        
        // Roots should be different
        assert_ne!(root1, root2);
        assert_ne!(root2, root3);
        
        // Same state should produce same root
        let mut trie2 = MerklePatriciaTrie::new();
        trie2.insert(vec![1, 2, 3], vec![100]);
        trie2.insert(vec![1, 2, 4], vec![200]);
        
        assert_eq!(trie.root(), trie2.root());
    }

    #[test]
    fn test_update_existing() {
        let mut trie = MerklePatriciaTrie::new();
        
        trie.insert(vec![1, 2, 3], vec![100]);
        let root1 = trie.root();
        
        trie.insert(vec![1, 2, 3], vec![200]);
        let root2 = trie.root();
        
        assert_ne!(root1, root2);
        assert_eq!(trie.get(&[1, 2, 3]), Some(vec![200]));
    }
}
