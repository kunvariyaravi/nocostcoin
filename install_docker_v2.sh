#!/bin/bash
set -e
echo "🚀 Installing Docker (Robust Mode)..."

# 1. Cleaning up
sudo yum clean all
sudo rm -f /var/lib/rpm/.rpm.lock

# 2. Add Repo (Lightweight)
if ! command -v yum-config-manager &> /dev/null; then
    sudo yum install -y yum-utils
fi
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 3. Install Docker (One package at a time to save RAM)
echo "📦 Installing Dependencies..."
sudo yum install -y container-selinux

echo "📦 Installing Docker CLI..."
sudo yum install -y docker-ce-cli

echo "📦 Installing Docker Engine..."
sudo yum install -y docker-ce

# 4. Start
echo "🔌 Starting Service..."
sudo systemctl enable --now docker
sudo usermod -aG docker opc

echo "✅ Docker Installed: $(docker --version)"
