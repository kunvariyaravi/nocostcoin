#!/bin/bash

# Nocostcoin Hostinger VPS Setup Script
# This script sets up a fresh Debian 12 VPS for Nocostcoin deployment

set -e

echo "=================================="
echo "Nocostcoin Hostinger VPS Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use: sudo bash setup-hostinger.sh)${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

echo -e "${YELLOW}Step 2: Installing Docker...${NC}"
# Install dependencies
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

echo -e "${GREEN}✓ Docker installed successfully${NC}"

echo -e "${YELLOW}Step 3: Installing additional tools...${NC}"
apt-get install -y git curl wget htop net-tools ufw

echo -e "${YELLOW}Step 4: Configuring firewall...${NC}"
# Configure UFW firewall
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 3000/tcp comment 'Nocostcoin UI'
ufw allow 8000/tcp comment 'Nocostcoin API'
ufw allow 9000/tcp comment 'Nocostcoin P2P'

echo -e "${GREEN}✓ Firewall configured${NC}"

echo -e "${YELLOW}Step 5: Creating application directory...${NC}"
mkdir -p /opt/nocostcoin
cd /opt/nocostcoin

echo -e "${YELLOW}Step 6: Cloning Nocostcoin repository...${NC}"
if [ -d "nocostcoin" ]; then
    echo -e "${YELLOW}Repository already exists, pulling latest changes...${NC}"
    cd nocostcoin
    git pull
else
    git clone https://github.com/kunvariyaravi/nocostcoin.git
    cd nocostcoin
fi

echo -e "${YELLOW}Step 7: Creating data directories...${NC}"
mkdir -p data/node-1
mkdir -p config

echo -e "${YELLOW}Step 8: Setting permissions...${NC}"
chmod +x deploy/scripts/*.sh

echo ""
echo -e "${GREEN}=================================="
echo "✓ Setup Complete!"
echo "==================================${NC}"
echo ""
echo "Next steps:"
echo "1. Review and configure config/nocostcoin.toml if needed"
echo "2. Run deployment: bash deploy/scripts/deploy-hostinger.sh"
echo ""
echo "Access URLs (after deployment):"
echo "  - Website: http://$(curl -s ifconfig.me):3000"
echo "  - Node API: http://$(curl -s ifconfig.me):8000"
echo "  - P2P: $(curl -s ifconfig.me):9000"
echo ""
