# Nocostcoin

**A Zero-Fee, High-Throughput Blockchain written in Rust.**

Nocostcoin is designed to eliminate transaction fees while maintaining security and decentralization through a unique Proof of Determinism (PoD) consensus mechanism.

## 🚀 Live Mainnet
The Nocostcoin Mainnet is live!

- **Website**: [https://nocostcoin.com](https://nocostcoin.com)
- **Explorer**: [https://nocostcoin.com/mainnet/explorer](https://nocostcoin.com/mainnet/explorer)
- **Paid API demo**: [https://nocostcoin.com/mainnet/agent-payments](https://nocostcoin.com/mainnet/agent-payments)
- **API Endpoint**: `https://api.nocostcoin.com`
- **Chain ID**: `1`

## 💸 Validator Economics

The chain mints **1,296,000 NCC every 30 days** and splits it between the
validators that produce blocks - one NCC for every block your node makes.
There is no stake and no lottery: every validator gets an equal share, so
holding more coins buys no extra blocks. Joining costs a refundable **100 NCC**
deposit, and anyone can join.

👉 **[Validator Guide](VALIDATOR_GUIDE.md)** - what a validator earns and how to
run one.

## 🤖 Agent Payments

An AI agent can pay for an API call with NCC instead of an API key. The
payment is the transaction, so there is no account, no key and no minimum
spend. The demo endpoint on the site verifies the payment against the chain
itself before serving anything.

👉 **[Agent Payments Guide](ui/src/app/documentation/agent-payments/page.tsx)** -
how it works, the signing format, and delegating a capped allowance to an
agent.

## 🛠️ Features
- **Zero Fees**: Transactions are free.
- **Permissionless Validators**: Join for a 100 NCC refundable deposit and take
  an equal share of the blocks.
- **Monthly Rewards**: 1,296,000 NCC minted every 30 days, paid to block
  producers.
- **Deterministic Schedule**: Round-robin leader selection, verifiable by VRF
  proof.
- **Rust Implementation**: Built for speed and memory safety.

## 📦 Joining the Network
Run your own validator node and join the mainnet. Anyone can join - the only
requirement is a refundable 100 NCC deposit in the node's wallet.

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

👉 **[Read the Full Validator Guide](VALIDATOR_GUIDE.md)** for detailed instructions on registering and configuration.

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
