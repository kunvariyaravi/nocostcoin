#!/bin/bash
set -e

echo "🚀 Starting NocostCoin LITE Deployment..."

# 1. Skip heavy system updates

# 2. Install Dependencies (Retry with check)
echo "🛠️ Installing Docker and Git..."
if ! command -v docker &> /dev/null; then
    sudo yum install -y docker git
    sudo systemctl enable --now docker
    sudo usermod -aG docker opc
else
    echo "Docker already installed."
fi

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
# sudo service iptables save

# 5. Clone Repository
echo "⬇️ Cloning Repository..."
if [ -d "nocostcoin" ]; then
    echo "Files exist, pulling latest..."
    cd nocostcoin
    git reset --hard
    git pull
else
    git clone https://github.com/kunvariyaravi/nocostcoin.git
    cd nocostcoin
fi

# 6. Start Services (Low Mem Mode)
echo "🚀 Starting Services..."
# Export Cargo build env to limit concurrency
export CARGO_BUILD_JOBS=1
export RUSTFLAGS="-C codegen-units=1"

# Use sudo for docker-compose
sudo sh -c 'export CARGO_BUILD_JOBS=1; /usr/local/bin/docker-compose up -d --build'

echo "✅ Deployment Complete!"
