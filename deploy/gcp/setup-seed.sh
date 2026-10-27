#!/bin/bash
# Nocostcoin GCP seed setup — runs ON the VM (Ubuntu 22.04).
# Env: DOMAIN=your.domain.com (required for nginx+certbot)
# Safe to re-run: pulls latest code, rebuilds, restarts.
set -e
DOMAIN="${DOMAIN:-}"

echo "=== 1. Docker ==="
if ! command -v docker &>/dev/null; then
  sudo apt-get update
  sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo systemctl enable --now docker
fi
sudo apt-get install -y git curl wget htop ufw 2>/dev/null || true
sudo ufw --force enable; sudo ufw default deny incoming; sudo ufw default allow outgoing
# 22 ssh, 80/443 http+https (nginx), 9000 p2p. The API (8000) and the UI (3000)
# stay on loopback and are only reachable through nginx.
for p in 22 80 443 9000; do sudo ufw allow $p/tcp; done

echo "=== 2. Code ==="
if [ -d /opt/nocostcoin/nocostcoin ]; then
  cd /opt/nocostcoin/nocostcoin && sudo git pull || true
else
  sudo mkdir -p /opt/nocostcoin && cd /opt/nocostcoin
  sudo git clone https://github.com/kunvariyaravi/nocostcoin.git
  cd nocostcoin
fi
cd /opt/nocostcoin/nocostcoin
sudo mkdir -p data/node-1 config

echo "=== 3. Fresh genesis timestamp ==="
# Always stamp genesis_time to NOW so slots start at ~0 (avoids giant slot numbers from stale files)
NOW_MS=$(date +%s000)
sudo sed -i -E "s/^genesis_time = .*/genesis_time = ${NOW_MS}/" config/nocostcoin-gcp-seed.toml
grep genesis_time config/nocostcoin-gcp-seed.toml

echo "=== 4. Build + start ==="
export DOMAIN="${DOMAIN}"
sudo -E docker compose -f docker-compose.gcp.yml down || true
sudo -E docker compose -f docker-compose.gcp.yml up -d --build
sleep 12
sudo docker compose -f docker-compose.gcp.yml ps
curl -fs http://localhost:8000/stats && echo " API OK" || echo " API not up yet — check: sudo docker compose -f docker-compose.gcp.yml logs -f node-1"

echo "=== 5. nginx + HTTPS ==="
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "YOUR_DOMAIN" ]; then
  sudo apt-get install -y nginx certbot python3-certbot-nginx
  sudo mkdir -p /etc/nginx/snippets
  sudo cp deploy/gcp/nginx-proxy-snippet.conf /etc/nginx/snippets/nocostcoin_proxy.conf
  sudo cp deploy/gcp/nginx-nocostcoin.conf /etc/nginx/sites-available/nocostcoin
  sudo sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" /etc/nginx/sites-available/nocostcoin
  sudo ln -sf /etc/nginx/sites-available/nocostcoin /etc/nginx/sites-enabled/nocostcoin
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t && sudo systemctl reload nginx
  sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" || echo "certbot failed — ensure DNS A records point here, then re-run certbot manually"
  echo "UI: https://${DOMAIN}  API: https://${DOMAIN}/api/node/stats"
else
  echo "DOMAIN not set — skipping nginx. The API and UI are loopback-only on this VM."
  echo "Tunnel them from your machine:  gcloud compute ssh <VM> -- -L 8000:localhost:8000 -L 3000:localhost:3000"
fi

echo "=== Seed PeerID (save for validator 2) ==="
sudo docker compose -f docker-compose.gcp.yml logs node-1 2>/dev/null | grep -im1 "peer id\|local peer\|PeerId" || echo "(PeerID not in logs yet — run: sudo docker compose -f docker-compose.gcp.yml logs node-1 | head -30)"
