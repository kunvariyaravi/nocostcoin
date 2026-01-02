#!/bin/bash
set -e
echo "🚀 Installing Docker (Static Binary)..."

# 1. Download Static Binaries
VERSION="24.0.7"
URL="https://download.docker.com/linux/static/stable/x86_64/docker-${VERSION}.tgz"

echo "⬇️ Downloading Docker ${VERSION}..."
curl -L $URL -o docker.tgz

# 2. Extract
echo "📦 Extracting..."
tar xzvf docker.tgz

# 3. Install
echo "🛠️ Installing Binaries..."
sudo cp docker/* /usr/local/bin/
rm -rf docker docker.tgz

# 4. Create Systemd Service
echo "⚙️ Configuring Systemd..."
sudo tee /etc/systemd/system/docker.service <<EOF
[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
After=network-online.target firewalld.service
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/dockerd
ExecReload=/bin/kill -s HUP \$MAINPID
LimitNOFILE=infinity
LimitNPROC=infinity
TimeoutStartSec=0
Delegate=yes
KillMode=process
Restart=always
StartLimitBurst=3
StartLimitInterval=60s

[Install]
WantedBy=multi-user.target
EOF

# 5. Create Group
sudo groupadd docker || true
sudo usermod -aG docker opc

# 6. Start
echo "🔌 Starting Docker..."
sudo systemctl daemon-reload
sudo systemctl enable --now docker

# 7. Install Docker Compose
if [ ! -f /usr/local/bin/docker-compose ]; then
    echo "🐳 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Docker Static Installation Complete!"
docker --version
