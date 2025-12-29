# Nocostcoin - Proof of Determinism Blockchain

[![Rust](https://img.shields.io/badge/rust-1.70%2B-orange.svg)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)

> A high-performance blockchain implementation featuring Proof of Determinism (PoD) consensus with VRF-based leader selection, purpose-built for the AI economy.

## 🌟 Key Features

### Consensus Innovation
- **Proof of Determinism (PoD)** - Deterministic leader schedule with VRF verification ([Read Whitepaper](WHITEPAPER.md))
- **Secret Leader Election** - Prevents targeted DDoS attacks
- **Stake-Weighted Selection** - Validators weighted by stake amount
- **Fallback Mechanism** - Backup validators ensure liveness (1-second delay)
- **Chained Randomness** - Prevents VRF grinding attacks
- **Equivocation Detection** - Automatic slashing for double-signing

### Performance
- ⚡ **2-second block times** - Fast finality
- 🔄 **100 transactions per block** - High throughput
- 📦 **1000-transaction mempool** - Efficient queuing
- 🌐 **P2P networking** - Decentralized via libp2p
- 🚀 **Native primitives** - Assets, NFTs, and payments built-in

### Security
- ✅ **VRF-based leader selection** - Cryptographically secure
- ✅ **Merkle root validation** - Transaction integrity
- ✅ **Atomic state updates** - Rollback on failure
- ✅ **Signature verification** - All transactions validated
- ✅ **Nonce tracking** - Replay attack prevention

### Modern Tech Stack
- 🦀 **Written in Rust** - Memory-safe and performant
- 🗄️ **RocksDB storage** - Production-grade persistence
- 🔗 **Merkle Patricia Trie** - Efficient state management
- 🌍 **libp2p networking** - Gossipsub, Kademlia DHT, mDNS
- ⚛️ **Next.js UI** - Modern React-based dashboard
- 📊 **Prometheus metrics** - Real-time monitoring

## 🚀 Quick Start

### Prerequisites
- **Rust 1.70+** - [Install Rust](https://rustup.rs/)
- **Node.js 18+** - [Install Node.js](https://nodejs.org/)
- **LLVM/Clang** - Required for RocksDB (Windows users)

#### Installing LLVM (Windows)
```powershell
winget install LLVM.LLVM
```

### Installation

```bash
git clone https://github.com/yourusername/nocostcoin.git
cd nocostcoin
```

### Build the Project

```powershell
# Windows - Set LLVM path for RocksDB
$env:LIBCLANG_PATH="C:\Program Files\LLVM\bin"
cd core
cargo build --release
```

```bash
# Linux/macOS
cd core
cargo build --release
```

### Launch Testnet

See [TESTNET_LAUNCH.md](TESTNET_LAUNCH.md) for detailed instructions.

**Quick 3-Node Local Network:**

```powershell
# Terminal 1 - Bootstrap Node
cd core
cargo run --release -- --port 9000

# Terminal 2 - Validator Node
cargo run --release -- --port 9001 --bootstrap "/ip4/127.0.0.1/tcp/9000"

# Terminal 3 - Validator Node
cargo run --release -- --port 9002 --bootstrap "/ip4/127.0.0.1/tcp/9000"

# Terminal 4 - UI
cd ui
npm install
npm run dev
```

**Access Points:**
- **UI Dashboard**: http://localhost:3000
- **API Node 1**: http://localhost:8000
- **API Node 2**: http://localhost:8001
- **API Node 3**: http://localhost:8002
- **Metrics**: http://localhost:9090-9092

## 📖 UI Features

The Next.js dashboard provides:

- 📊 **Dashboard** - Real-time network statistics
- 💰 **Wallet** - Balance, address, transaction history
- 🔍 **Explorer** - Browse blocks and transactions
- 🌐 **Network** - Connected peers and status
- 💧 **Faucet** - Request test tokens
- 📝 **Mempool** - View pending transactions

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Nocostcoin Stack                     │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐      │
│  │      Next.js UI (Port 3000)                  │      │
│  │  Dashboard | Wallet | Explorer | Network     │      │
│  └──────────────────┬───────────────────────────┘      │
│                     │ REST API                          │
│  ┌──────────────────┴───────────────────────────┐      │
│  │         Blockchain Nodes (Ports 8000+)       │      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │      │
│  │  │ Consensus│  │  Chain   │  │  State   │   │      │
│  │  │   (PoD)  │◄─┤ Manager  │◄─┤  (MPT)   │   │      │
│  │  └──────────┘  └──────────┘  └──────────┘   │      │
│  │       ▲             ▲              ▲          │      │
│  │  ┌────┴─────────────┴──────────────┴────┐    │      │
│  │  │    Network Layer (libp2p)            │    │      │
│  │  │  Gossipsub │ Kademlia │ mDNS │ RPC  │    │      │
│  │  └──────────────────────────────────────┘    │      │
│  │  ┌──────────────────────────────────────┐    │      │
│  │  │      Storage (RocksDB)               │    │      │
│  │  └──────────────────────────────────────┘    │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │   Prometheus Metrics (Ports 9090+)           │      │
│  └──────────────────────────────────────────────┘      │
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
✅ Faucet rate limiting (24-hour cooldown)

### Production Roadmap
- [ ] Transaction fees and gas mechanism
- [ ] Network rate limiting
- [ ] Block/transaction size limits
- [ ] Finality mechanism (BFT-style)
- [ ] Peer reputation system
- [ ] Time synchronization (NTP)

**Status**: ✅ Safe for Testnet | ⚠️ Not production-ready

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
├── core/                    # Rust Blockchain Core
│   ├── src/
│   │   ├── main.rs         # Node entry point
│   │   ├── consensus.rs    # PoD consensus
│   │   ├── chain.rs        # Block management
│   │   ├── state.rs        # State machine
│   │   ├── storage.rs      # RocksDB interface
│   │   ├── network.rs      # P2P networking
│   │   └── api.rs          # REST API
│   └── Cargo.toml          # Dependencies
├── ui/                      # Next.js UI
│   ├── src/
│   │   ├── app/            # Pages
│   │   ├── components/     # React components
│   │   └── utils/          # Helper functions
│   └── package.json        # JS dependencies
├── config/                  # Node configurations
├── docs/                    # Documentation
├── WHITEPAPER.md           # Technical whitepaper
├── TESTNET_LAUNCH.md       # Launch instructions
└── README.md               # This file
```

## 🎯 Use Cases

- **AI Economy**: Native primitives for autonomous agents
- **Research**: Study deterministic consensus mechanisms
- **Education**: Learn blockchain development in Rust
- **Testing**: Experiment with VRF-based leader selection
- **Development**: Build dApps on a fast, deterministic chain

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Areas of interest:
- Transaction fee mechanisms
- Network optimizations
- Finality improvements
- Additional test coverage
- UI/UX enhancements
- Documentation

## 📜 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

Built with:
- [schnorrkel](https://github.com/w3f/schnorrkel) - VRF implementation
- [libp2p](https://libp2p.io/) - P2P networking
- [RocksDB](https://rocksdb.org/) - Embedded database
- [tokio](https://tokio.rs/) - Async runtime
- [Next.js](https://nextjs.org/) - React framework
- [TailwindCSS](https://tailwindcss.com/) - UI styling

## 📞 Contact

- GitHub Issues: [Report bugs or request features](https://github.com/yourusername/nocostcoin/issues)
- Discussions: [Join the conversation](https://github.com/yourusername/nocostcoin/discussions)

---

**⚠️ Disclaimer**: This is experimental software. Not recommended for production use without additional security hardening.

**Built with ❤️ in Rust + TypeScript**
