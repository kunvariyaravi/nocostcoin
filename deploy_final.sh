#!/bin/bash
set -e

# IDEMPOTENT DEPLOYMENT SCRIPT

echo "🚀 Starting Deployment..."

# 1. Docker
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    sudo yum install -y docker git
    sudo systemctl enable --now docker
    sudo usermod -aG docker opc
else
    echo "✅ Docker already installed"
fi

# 2. Docker Compose
if [ ! -f /usr/local/bin/docker-compose ]; then
    echo "🐳 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose already installed"
fi

# 3. Firewall
echo "🛡️ Configuring Firewall..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3001 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT || true
# sudo service iptables save || true

# 4. Clone & Pull
echo "⬇️ Fetching Code..."
if [ -d "nocostcoin" ]; then
    cd nocostcoin
    git reset --hard
    git pull
else
    git clone https://github.com/kunvariyaravi/nocostcoin.git
    cd nocostcoin
fi

# 5. Launch
echo "🚀 Launching Containers..."
# Low memory optimizations
export CARGO_BUILD_JOBS=1
export RUSTFLAGS="-C codegen-units=1"

# We run with `sudo` because `opc` group change requires relogin
sudo /usr/local/bin/docker-compose up -d --build

echo "✅ SUCCESS! Node is running."
