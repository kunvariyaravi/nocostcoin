# Nocostcoin Validator Guide

This guide explains how to join the Nocostcoin Testnet as a new validator node.

## Prerequisites
- A server or computer with:
  - 2 CPU Cores
  - 4GB RAM
  - 50GB Disk Space
- Docker & Docker Compose installed
- Port `9000` (P2P) and `8000` (API) open

## Step 1: Clone the Repository
```bash
git clone https://github.com/kunvariyaravi/nocostcoin.git
cd nocostcoin
```

## Step 2: Configure Your Node
The `config/nocostcoin.toml` comes pre-configured with the main bootstrap node. You don't need to change anything unless you want to customize your port.

**Check `config/nocostcoin.toml`:**
```toml
[network]
port = 9000
bootstrap_peers = [
    "/ip4/72.62.167.94/tcp/9000/p2p/12D3KooWLDNRYGTyFhLuD29m3eDazhhVQQfXCowSnBfTnh1y5xtH"
]
```

## Step 3: Run the Node
You can run the node using Docker (recommended) or direct binary.

### Option A: Using Docker
```bash
docker-compose up -d --build
```
This will build and start your node. It will automatically connect to the bootstrap peer and start syncing.

### Option B: Using Cargo (Rust)
```bash
cargo run --release -- --config config/nocostcoin.toml
```

## Step 4: Verify Connection
Check your logs to see if you are connecting to peers:
```bash
docker logs -f nocostcoin-node-1-1
```
Look for "Connected to peer" messages. You can also check the health endpoint:
```bash
curl -s http://127.0.0.1:8000/health
```

## Step 5: Become a Validator

> **Anyone can register.** There is no stake and no allowlist. A validator locks
> a refundable **100 NCC deposit** and then takes an equal share of the slots -
> there is no stake weighting, so holding more coins buys no extra blocks. The
> deposit is an anti-Sybil measure, and it is forfeited only by a validator that
> signs two different blocks for the same slot.

To register this node, it needs at least 100 NCC in its wallet (claim some from
the faucet first) and then:

```bash
curl -X POST http://127.0.0.1:8000/validator/register \
  -H 'Content-Type: application/json' \
  -d '{"deposit":100}'
```

The node signs the registration with its own consensus key, so it proves it holds
the key it is registering. The registration takes effect in the next epoch.

To leave the set, send an `UnregisterValidator` transaction - the deposit is
refunded.

1.  **Generate a Wallet**:
    ```bash
    curl -X POST http://127.0.0.1:8000/wallet/new
    ```
2.  **Get Testnet Coins**: Ask for coins in the community channel or use the faucet (if available).
