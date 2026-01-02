#!/bin/bash
set -e
echo "🚀 Installing Docker from Official Repo..."

# Install config-manager
sudo yum install -y yum-utils

# Add Docker Repo
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker CE (Lite)
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Enable & Start
sudo systemctl enable --now docker
sudo usermod -aG docker opc

echo "✅ Docker Installed Successfully"
docker --version
