# Nocostcoin

**A Zero-Fee, High-Throughput Blockchain written in Rust.**

Nocostcoin is designed to eliminate transaction fees while maintaining security and decentralization through a unique Proof of Determinism (PoD) consensus mechanism.

## 🚀 Live Mainnet
The Nocostcoin Mainnet is live!

- **Website**: [https://nocostcoin.com](https://nocostcoin.com)
- **Explorer**: [https://nocostcoin.com/mainnet/explorer](https://nocostcoin.com/mainnet/explorer)
- **API Endpoint**: `https://api.nocostcoin.com`
- **Chain ID**: `1`

## 🛠️ Features
- **Zero Fees**: Transactions are free.
- **L1 Security Guardrails**: Built-in protection against integer overflows, cross-network replays, and mempool spam.
- **High Throughput**: 10,000+ TPS target with 2s block times.
- **PoD Consensus**: Deterministic leader selection using VRFs for maximum predictability.
- **Rust Implementation**: Built for speed and memory safety.

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

### Running a Validator on Google Cloud
Deploy a validator node to a GCP VM - the node API is served at
`https://api.nocostcoin.com` and the website stays on Vercel.

👉 **[GCP Validator Deployment Guide](deploy/gcp/README.md)** - VM setup, the
genesis ceremony, DNS, and the Vercel environment variables.

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
