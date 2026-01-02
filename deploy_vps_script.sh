#!/bin/bash
set -e

echo "🚀 Starting NocostCoin Deployment..."

# 1. Update System
echo "📦 Updating system packages..."
sudo yum update -y

# 2. Install Dependencies
echo "🛠️ Installing Docker and Git..."
sudo yum install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker opc

# 3. Install Docker Compose
echo "🐳 Installing Docker Compose..."
if [ ! -f /usr/local/bin/docker-compose ]; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 4. Configure Firewall
echo "mb Configure Firewall..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3001 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT
# Check if iptables-services is installed to save rules
sudo yum install -y iptables-services
# sudo service iptables save || echo "Skipping save, iptables service might differ"

# 5. Clone Repository
echo "⬇️ Cloning Repository..."
if [ -d "nocostcoin" ]; then
    echo "Files exist, pulling latest..."
    cd nocostcoin
    git pull
else
    git clone https://github.com/kunvariyaravi/nocostcoin.git
    cd nocostcoin
fi

# 6. Start Services
echo "🚀 Starting Services..."
# Use host networking or expose ports? 
# The repo uses docker-compose.yml by default.
# We need to ensure we run with privileges since 'opc' group change needs re-login
sudo /usr/local/bin/docker-compose up -d --build

echo "✅ Deployment Complete!"
echo "You can access the node at http://$(curl -s ifconfig.me):3001"
