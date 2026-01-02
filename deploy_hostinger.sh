#!/bin/bash
set -e

echo "🚀 Deploying Nocostcoin on Hostinger (Debian 12+)..."

# 1. Update System
echo "📦 Updating repositories..."
apt-get update -y
apt-get install -y ca-certificates curl gnupg git iptables

# 2. Install Docker (Official Repo)
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
    echo "✅ Docker already installed."
fi

# 3. Configure Firewall (Basic)
echo "🛡️ Configuring Firewall..."
# Ensure these ports are open
iptables -I INPUT -p tcp --dport 22 -j ACCEPT
iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
iptables -I INPUT -p tcp --dport 3001 -j ACCEPT
iptables -I INPUT -p tcp --dport 8080 -j ACCEPT
iptables -I INPUT -p tcp --dport 9090 -j ACCEPT
# Persist? (Debian requires iptables-persistent, typically)
# We'll just leave them runtime for now or use UFW if available

# 4. Clone / Pull Repository
echo "⬇️ Fetching Code..."
mkdir -p ~/deployment
cd ~/deployment
if [ -d "nocostcoin" ]; then
    cd nocostcoin
    git reset --hard
    git pull
else
    git clone https://github.com/kunvariyaravi/nocostcoin.git
    cd nocostcoin
fi

# 5. Launch Node
echo "🚀 Starting Node..."
# Using standard docker compose command (v2 plugin)
docker compose down || true
docker compose up -d --build

echo "✅ Deployment Started!"
echo "   - API: http://$(curl -s ifconfig.me):3000"
echo "   - UI:  http://$(curl -s ifconfig.me):3001"
