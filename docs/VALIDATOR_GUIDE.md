# Nocostcoin Validator Guide

Welcome to the Nocostcoin Testnet! Follow this guide to join the network as a validator.

## Prerequisites

- **Hardware**: 2 vCPU, 4GB RAM, 50GB SSD (e.g., AWS t3.medium or DigitalOcean Droplet).
- **OS**: Ubuntu 22.04 LTS (recommended).
- **Software**: Docker & Docker Compose.

## 1. Installation

Clone the repository or create a working directory:

```bash
mkdir nocostcoin-validator
cd nocostcoin-validator
```

## 2. Configuration

Create a `nocostcoin.toml` file:

```toml
[network]
# External IP of your server (IMPORTANT for discovery)
listen_addr = "/ip4/0.0.0.0/tcp/9000"
# Port to listen on (9000 is default)
port = 9000
# Official Testnet Bootnodes
bootstrap_peers = [
    "/dns4/bootnode-1.nocostcoin.com/tcp/9000",
    "/dns4/bootnode-2.nocostcoin.com/tcp/9000"
]

[genesis]
# Provided by the Nocostcoin team for Testnet
genesis_time = 1733760000000 
genesis_seed = "nocostcoin-genesis-seed"
initial_validators = ["nocostcoin_node_9000_seed", ...]

[mining]
enabled = true
# Optional: Use a deterministic seed for your validator identity (keep secret!)
# validator_seed = "my-secret-seed-phrase" 
```

## 3. Deployment (Docker Compose)

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  validator:
    image: nocostcoin/core:latest
    ports:
      - "9000:9000" # P2P
      - "8000:8000" # API
    volumes:
      - ./data:/usr/local/bin/data
      - ./nocostcoin.toml:/usr/local/bin/config/nocostcoin.toml
    command: [ "./nocostcoin", "--config", "config/nocostcoin.toml" ]
    restart: unless-stopped
```

## 4. Running the Node

Start your validator:

```bash
docker-compose up -d
```

Check logs:

```bash
docker-compose logs -f
```

## 5. Staking

To become an active validator, you need to stake tokens.
1.  **Get Tokens**: Use the [Testnet Faucet](https://faucet.nocostcoin.org).
2.  **Register**: Send a `RegisterValidator` transaction using the API or CLI.

```bash
# Example using curl to register (if you have the CLI tool locally)
curl -X POST http://localhost:8000/validator/register -d '{"stake": 1000}'
```

Because Nocostcoin uses **Secret Leader Election**, your node will automatically start producing blocks when selected, without revealing your identity beforehand!
