#!/bin/bash
set -e
echo "🚀 Deploying (Static Docker)..."

# 1. Firewall
echo "🛡️ Configuring Firewall..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3001 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT || true

# 2. Clone
echo "⬇️ Fetching Code..."
if [ -d "nocostcoin" ]; then
    cd nocostcoin
    git reset --hard
    git pull
else
    git clone https://github.com/kunvariyaravi/nocostcoin.git
    cd nocostcoin
fi

# 3. Launch
echo "🐳 Starting Containers..."
export CARGO_BUILD_JOBS=1
export RUSTFLAGS="-C codegen-units=1"
# Use absolute path to docker-compose
/usr/local/bin/docker-compose up -d --build

echo "✅ Deployment Started!"
