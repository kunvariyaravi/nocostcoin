#!/bin/bash
set -e
echo "🚀 Installing Podman..."

# Minimal cleanup
sudo dnf clean all

# Install Podman (usually lighter than Docker CE)
sudo dnf install -y podman

# Install docker-compose (standalone) if missing
if [ ! -f /usr/local/bin/docker-compose ]; then
    echo "🐳 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Podman Installed: $(podman --version)"
