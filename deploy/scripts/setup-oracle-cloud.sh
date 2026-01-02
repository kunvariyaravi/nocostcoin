#!/bin/bash
# Automated setup script for Oracle Cloud Free Tier
# Run this after SSH into your Oracle Cloud instance

set -e

echo "========================================="
echo "Nocostcoin Node Setup for Oracle Cloud"
echo "========================================="

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo "📚 Installing Git..."
sudo apt install -y git

# Install monitoring tools
echo "📊 Installing monitoring tools..."
sudo apt install -y curl jq htop net-tools

# Configure firewall (Oracle uses iptables)
echo "🔥 Configuring firewall..."
sudo iptables -I INPUT 1 -p tcp --dport 9000 -j ACCEPT  # P2P
sudo iptables -I INPUT 1 -p tcp --dport 8000 -j ACCEPT  # API
sudo iptables -I INPUT 1 -p tcp --dport 3000 -j ACCEPT  # UI
sudo iptables -I INPUT 1 -p tcp --dport 9090 -j ACCEPT  # Metrics

# Save iptables rules
sudo netfilter-persistent save 2>/dev/null || echo "netfilter-persistent not installed, rules won't persist across reboots"

# Enable Docker on boot
echo "⚙️ Enabling Docker service..."
sudo systemctl enable docker

# Create working directory
echo "📁 Creating workspace..."
mkdir -p ~/nocostcoin
cd ~/nocostcoin

# Clone repository (or you can upload via SCP)
echo "📥 Ready to clone repository..."
echo ""
echo "Next steps:"
echo "1. Logout and login again for Docker group to take effect: exit"
echo "2. SSH back in"
echo "3. Clone repository: git clone https://github.com/yourusername/nocostcoin.git"
echo "4. cd nocostcoin"
echo "5. Run node: docker-compose -f docker-compose.minimal.yml up -d"
echo ""
echo "Optional - Setup systemd service instead of Docker:"
echo "6. Build binary: cd core && cargo build --release"
echo "7. Setup service: sudo cp deploy/systemd/nocostcoin.service /etc/systemd/system/"
echo "8. Start service: sudo systemctl enable --now nocostcoin"
echo ""
echo "========================================="
echo "✅ Setup complete!"
echo "========================================="
