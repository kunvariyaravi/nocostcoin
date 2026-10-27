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
data_dir = "/data"

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
chain_id = 1337
genesis_time = 1733760000000 
genesis_seed = "nocostcoin-genesis-seed"
# Testnet validators are seed-derived. The matching `mining.validator_seed`
# below MUST be one of these strings, otherwise the node's key will not match
# its genesis entry and it will never be elected.
initial_validator_seeds = ["nocostcoin_node_9000_seed", ...]

[mining]
enabled = true
# Optional: Use a deterministic seed for your validator identity (keep secret!)
# validator_seed = "my-secret-seed-phrase" 
```

> **Mainnet differs.** On mainnet the genesis lists validator *public keys*
> (`initial_validators`) and `mining.validator_seed` is forbidden - the seed is
> the validator's secret key. See `LAUNCH.md`.

## 3. Deployment (Docker Compose)

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  validator:
    image: nocostcoin/core:latest
    ports:
      - "9000:9000"         # P2P (public)
      - "127.0.0.1:8000:8000" # API (loopback only)
    volumes:
      - ./data:/data       # must match data_dir above
      - ./nocostcoin.toml:/usr/local/bin/config/nocostcoin.toml:ro
    command: [ "./nocostcoin", "--config", "config/nocostcoin.toml" ]
    environment:
      - NOCOSTCOIN_API_BIND=0.0.0.0   # inside the container
      - NOCOSTCOIN_ENABLE_FAUCET=1    # testnet only
    restart: unless-stopped
```

`data_dir` must match the volume mount, otherwise the chain database and the
node keys are written inside the container and lost on every recreate.

## 4. Running the Node

Start your validator:

```bash
docker-compose up -d
```

Check logs:

```bash
docker-compose logs -f
```

The node exposes a health endpoint:

```bash
curl -s http://127.0.0.1:8000/health
```

## 5. Staking

To become an active validator, you need to stake tokens.
1.  **Get Tokens**: Use the [Testnet Faucet](https://faucet.nocostcoin.org).
2.  **Register**: Send a `RegisterValidator` transaction using the API or CLI.

```bash
# Example using curl to register (if you have the CLI tool locally)
curl -X POST http://127.0.0.1:8000/validator/register \
     -H "Content-Type: application/json" \
     -d '{"stake": 1000}'
```

If the node runs with `NOCOSTCOIN_API_TOKEN` set, add the bearer token to the
request:

```bash
curl -X POST http://127.0.0.1:8000/validator/register \
     -H "Authorization: Bearer $NOCOSTCOIN_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"stake": 1000}'
```

Because Nocostcoin uses **Secret Leader Election**, your node will automatically start producing blocks when selected, without revealing your identity beforehand!
