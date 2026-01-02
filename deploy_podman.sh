#!/bin/bash
set -e
echo "🚀 Deploying with Podman..."

# Install docker-compose if missing
if [ ! -f /usr/local/bin/docker-compose ]; then
    echo "🐳 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Enable socket
echo "🔌 Enabling Podman Socket..."
sudo systemctl enable --now podman.socket
sudo chmod 666 /run/podman/podman.sock

# Clone Repo
echo "⬇️ Fetching Code..."
if [ -d "nocostcoin" ]; then
    cd nocostcoin
    git reset --hard
    git pull
else
    git clone https://github.com/kunvariyaravi/nocostcoin.git
    cd nocostcoin
fi

# Build config for low memory
export CARGO_BUILD_JOBS=1
export RUSTFLAGS="-C codegen-units=1"
export DOCKER_HOST="unix:///run/podman/podman.sock"

# Try running
echo "🐳 Starting containers..."
/usr/local/bin/docker-compose up -d --build

echo "✅ Podman Deployment Complete!"
