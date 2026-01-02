# Nocostcoin

**A Zero-Fee, High-Throughput Blockchain written in Rust.**

Nocostcoin is designed to eliminate transaction fees while maintaining security and decentralization through a unique Reputation-Based Proof of Stake (RPoS) consensus mechanism.

## 🚀 Live Testnet
The Nocostcoin Testnet is live!

- **Website**: [https://nocostcoin.com](https://nocostcoin.com)
- **Explorer**: [https://nocostcoin.com/testnet/explorer](https://nocostcoin.com/testnet/explorer)
- **API Endpoint**: `https://api.nocostcoin.com`
- **Chain ID**: `testnet-1`

## 🛠️ Features
- **Zero Fees**: Transactions are free.
- **High Throughput**: 10,000+ TPS target.
- **RPoS Consensus**: Validates based on stake + reputation score.
- **Rust Implementation**: Built for speed and safety.

## 📦 Joining the Network
Run your own validator node and join the testnet.

### Quick Start (Docker)
1. Clone the repo:
   ```bash
   git clone https://github.com/kunvariyaravi/nocostcoin.git
   cd nocostcoin
   ```
2. Start the node:
   ```bash
   docker-compose up -d
   ```
3. Your node will automatically connect to the bootstrap peer and start syncing.

👉 **[Read the Full Validator Guide](VALIDATOR_GUIDE.md)** for detailed instructions on staking and configuration.

## 💻 Development

### Prerequisites
- Rust (latest stable)
- Docker & Docker Compose
- Clang (for RocksDB)

### Build
```bash
cargo build --release
```

### Run Locally
```bash
cargo run --release -- --config config/nocostcoin.toml
```

## 📜 License
MIT License
