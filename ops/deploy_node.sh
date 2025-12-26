#!/bin/bash
set -e

# Nocostcoin Node Deployment Script
# Usage: ./deploy_node.sh [NODE_NAME] [PORT_OFFSET]
# Example: ./deploy_node.sh validator-1 0 (Runs on 9000)

NODE_NAME=${1:-"nocostcoin-node"}
PORT_OFFSET=${2:-0}

P2P_PORT=$((9000 + PORT_OFFSET))
API_PORT=$((8000 + PORT_OFFSET))

echo "🚀 Deploying $NODE_NAME on ports P2P:$P2P_PORT / API:$API_PORT"

# 1. Install Docker if missing
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# 2. Setup Directory Structure
mkdir -p $NODE_NAME/config
mkdir -p $NODE_NAME/data
cd $NODE_NAME

# 3. Create Config if missing
if [ ! -f config/nocostcoin.toml ]; then
    echo "Creating default config..."
    cat > config/nocostcoin.toml <<EOF
[network]
port = $P2P_PORT
bootstrap_peers = [] # Add bootnodes here
listen_addr = "/ip4/0.0.0.0/tcp/$P2P_PORT"

[genesis]
genesis_time = 1733760000000
genesis_seed = "nocostcoin-genesis-seed"
initial_validators = []

[mining]
enabled = true
EOF
fi

# 4. Start Node via Docker
echo "Starting Node container..."
docker run -d \
    --name $NODE_NAME \
    --restart unless-stopped \
    -p $P2P_PORT:$P2P_PORT \
    -p $API_PORT:$API_PORT \
    -v $(pwd)/data:/usr/local/bin/data \
    -v $(pwd)/config:/usr/local/bin/config \
    nocostcoin/core:latest \
    ./nocostcoin --config config/nocostcoin.toml

echo "✅ Node Deployed! Logs:"
docker logs -f $NODE_NAME
