# Nocostcoin - Proof of Determinism Blockchain

[![Rust](https://img.shields.io/badge/rust-1.70%2B-orange.svg)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Security](https://img.shields.io/badge/security-68%2F100-yellow.svg)](#security)

> A high-performance blockchain implementation featuring Proof of Determinism (PoD) consensus with VRF-based leader selection, built in Rust.

## 🌟 Key Features

### Consensus Innovation
- **Proof of Determinism (PoD)** - Deterministic leader schedule with VRF verification
- **Stake-Weighted Selection** - Validators weighted by stake amount
- **Fallback Mechanism** - Backup validators ensure liveness (1-second delay)
- **Chained Randomness** - Prevents VRF grinding attacks
- **Equivocation Detection** - Automatic slashing for double-signing

### Performance
- ⚡ **2-second block times** - Fast finality
- 🔄 **100 transactions per block** - High throughput
- 📦 **1000-transaction mempool** - Efficient queuing
- 🌐 **P2P networking** - Decentralized via libp2p

### Security
- ✅ **VRF-based leader selection** - Cryptographically secure
- ✅ **Merkle root validation** - Transaction integrity
- ✅ **Atomic state updates** - Rollback on failure
- ✅ **Signature verification** - All transactions validated
- ✅ **Nonce tracking** - Replay attack prevention

### Architecture
- 🦀 **Written in Rust** - Memory-safe and performant
- 🗄️ **Persistent storage** - Embedded sled database
- 🔗 **Merkle Patricia Trie** - Efficient state management
- 🌍 **libp2p networking** - Gossipsub, Kademlia DHT, mDNS

## 🚀 Quick Start

### Prerequisites
- Rust 1.70+ ([Install Rust](https://rustup.rs/))
- Windows/Linux/macOS

### Installation

```bash
git clone https://github.com/yourusername/nocostcoin.git
cd nocostcoin
cargo build --release
```

### Launch Devnet (Automated)

```powershell
# Windows
.\launch_devnet.ps1

# Linux/macOS
./launch_devnet.sh
```

This launches a 3-node local network automatically!

### Manual Launch

**Node 1 (Bootstrap):**
```bash
cargo run --release -- --port 9000
```

**Node 2 (Validator):**
```bash
cargo run --release -- --port 9001 --bootstrap /ip4/127.0.0.1/tcp/9000
```

**Node 3 (Validator):**
```bash
cargo run --release -- --port 9002 --bootstrap /ip4/127.0.0.1/tcp/9000
```

## 📖 Interactive Commands

Once running, use these commands in any node terminal:

| Command | Description |
|---------|-------------|
| `info` | Display node status, height, balance |
| `sim` | Toggle automatic transaction generation |
| `send random 100` | Send 100 tokens to random address |
| `send <addr> <amt>` | Send tokens to specific address |
| `help` | Show all commands |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Nocostcoin Node                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Consensus│  │  Chain   │  │  State   │             │
│  │   (PoD)  │◄─┤ Manager  │◄─┤  (MPT)   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│       ▲             ▲              ▲                    │
│       │             │              │                    │
│  ┌────┴─────────────┴──────────────┴────┐              │
│  │         Network Layer (libp2p)       │              │
│  │  Gossipsub │ Kademlia │ mDNS │ RPC  │              │
│  └──────────────────────────────────────┘              │
│       ▲                                                 │
│       │                                                 │
│  ┌────┴──────────────────────────────────┐             │
│  │      Storage (sled embedded DB)       │             │
│  └───────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Security

**Current Security Rating: 68/100**

### Implemented Security Features
✅ VRF threshold validation with stake requirements  
✅ Merkle root validation for transactions  
✅ Atomic state updates with rollback  
✅ Equivocation detection and slashing  
✅ Chained randomness (VRF grinding prevention)  
✅ Signature verification on all transactions  
✅ Nonce-based replay protection  

### Production Roadmap
- [ ] Transaction fees and gas mechanism
- [ ] Network rate limiting
- [ ] Block/transaction size limits
- [ ] Finality mechanism (BFT-style)
- [ ] Peer reputation system
- [ ] Time synchronization (NTP)

**Status**: ✅ Safe for devnet | ⚠️ Not production-ready

## 📊 Consensus Details

### Proof of Determinism (PoD)

Nocostcoin uses a unique consensus mechanism combining deterministic leader scheduling with VRF-based verification:

1. **Leader Selection**: Round-robin based on `slot % N` (deterministic)
2. **VRF Verification**: Validators prove eligibility via VRF signature
3. **Stake Weighting**: Minimum 0.1% stake required to produce blocks
4. **Fallback**: Backup validators activate after 1-second delay
5. **Finality**: Longest chain rule (highest slot wins)

**Parameters:**
- Slot Duration: 2 seconds
- Epoch Duration: 1 hour (1800 slots)
- Fallback Delay: 1 second
- Min Stake: 0.1% of total stake

## 🧪 Testing

Run the test suite:
```bash
cargo test
```

Run specific tests:
```bash
cargo test test_vrf_threshold
cargo test consensus::tests
cargo test chain::tests
```

## 📁 Project Structure


```
nocostcoin/
├── core/                 # Rust Blockchain Core
│   ├── src/              # Source code
│   ├── Cargo.toml        # Rust dependencies
│   └── ...
├── ui/                   # Next.js Website (formerly website/)
│   ├── src/              # UI Source code
│   ├── package.json      # JS dependencies
│   └── ...
├── launch_devnet.ps1     # Automated devnet launcher
├── launch_devnet.sh      # Launcher for Linux/macOS
└── README.md             # This file
```

## 🎯 Use Cases

- **Research**: Study deterministic consensus mechanisms
- **Education**: Learn blockchain development in Rust
- **Testing**: Experiment with VRF-based leader selection
- **Development**: Build dApps on a fast, deterministic chain

## 🤝 Contributing

Contributions welcome! Areas of interest:
- Transaction fee mechanisms
- Network optimizations
- Finality improvements
- Additional test coverage
- Documentation

## 📜 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

Built with:
- [schnorrkel](https://github.com/w3f/schnorrkel) - VRF implementation
- [libp2p](https://libp2p.io/) - P2P networking
- [sled](https://github.com/spacejam/sled) - Embedded database
- [tokio](https://tokio.rs/) - Async runtime

## 📞 Contact

- GitHub Issues: [Report bugs or request features](https://github.com/yourusername/nocostcoin/issues)
- Discussions: [Join the conversation](https://github.com/yourusername/nocostcoin/discussions)

---

**⚠️ Disclaimer**: This is experimental software. Not recommended for production use without additional security hardening.

**Built with ❤️ in Rust**
