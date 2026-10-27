#!/bin/bash
# Nocostcoin GCP validator setup - runs ON the VM (Ubuntu 22.04).
#
# Env:
#   DOMAIN=your.domain.com          (optional - enables nginx + Let's Encrypt)
#   NOCOSTCOIN_API_TOKEN=<secret>   (recommended - protects write endpoints)
#   MODE=setup|identity|restart     (default: setup)
#   RUN_TESTS=1                     (optional - runs the Rust test suite in Docker)
#
# Modes:
#   setup     install Docker, fetch the code, build and start the node
#   identity  print this node's validator pubkey + wallet address (the ceremony)
#   restart   rebuild and restart after the genesis file has been updated
#
# Safe to re-run: it pulls the latest code, rebuilds and restarts.
set -e

DOMAIN="${DOMAIN:-}"
MODE="${MODE:-setup}"
REPO_DIR=/opt/nocostcoin/nocostcoin
COMPOSE="docker compose -f docker-compose.gcp-validator.yml"

install_docker() {
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
  sudo ufw --force enable
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  # 22 ssh, 80/443 http+https (nginx), 9000 p2p. The API (8000) is NOT opened:
  # it is reachable through nginx on https://$DOMAIN/api/node only.
  for p in 22 80 443 9000; do sudo ufw allow $p/tcp; done
}

fetch_code() {
  if [ -d "$REPO_DIR/.git" ]; then
    cd "$REPO_DIR" && sudo git pull
  else
    sudo mkdir -p /opt/nocostcoin
    sudo git clone https://github.com/kunvariyaravi/nocostcoin.git "$REPO_DIR"
    cd "$REPO_DIR"
  fi
  sudo mkdir -p data/validator
  # The API token lives on the VM only, never in the repo.
  if [ -n "${NOCOSTCOIN_API_TOKEN:-}" ]; then
    printf 'NOCOSTCOIN_API_TOKEN=%s\n' "$NOCOSTCOIN_API_TOKEN" | sudo tee .env > /dev/null
    sudo chmod 600 .env
  fi
}

run_tests() {
  echo "=== Rust test suite (inside the Docker builder) ==="
  sudo docker build --target builder -t nocostcoin-builder ./core
  sudo docker run --rm nocostcoin-builder cargo test --release
}

print_identity() {
  echo "=== Genesis ceremony: this node's identity ==="
  echo "The secret keys stay on this machine. Only the values below are public."
  cd "$REPO_DIR"
  sudo $COMPOSE build node-1
  sudo $COMPOSE run --rm node-1 --config config/mainnet-gcp.toml --identity
}

setup_nginx() {
  if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "YOUR_DOMAIN" ]; then
    sudo apt-get install -y nginx certbot python3-certbot-nginx
    sudo mkdir -p /etc/nginx/snippets
    sudo cp deploy/gcp/nginx-proxy-snippet.conf /etc/nginx/snippets/nocostcoin_proxy.conf
    sudo cp deploy/gcp/nginx-validator.conf /etc/nginx/sites-available/nocostcoin
    sudo sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" /etc/nginx/sites-available/nocostcoin
    sudo ln -sf /etc/nginx/sites-available/nocostcoin /etc/nginx/sites-enabled/nocostcoin
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
    sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" \
      || echo "certbot failed - ensure the DNS A records point at this VM, then re-run certbot manually"
    echo "API:  https://${DOMAIN}/api/node/stats"
    echo "UI:   https://${DOMAIN}  (start it with: docker compose -f docker-compose.gcp-validator.yml --profile ui up -d)"
  else
    echo "DOMAIN not set - skipping nginx."
    echo "The API and UI are loopback-only on this VM. Tunnel them from your machine:"
    echo "  gcloud compute ssh $VM -- -L 8000:localhost:8000 -L 3000:localhost:3000"
  fi
}

install_docker
fetch_code

case "$MODE" in
  identity)
    print_identity
    ;;
  restart)
    cd "$REPO_DIR"
    sudo -E $COMPOSE down
    sudo -E $COMPOSE up -d --build
    ;;
  setup)
    cd "$REPO_DIR"
    if [ "${RUN_TESTS:-0}" = "1" ]; then run_tests; fi
    sudo -E $COMPOSE down || true
    sudo -E $COMPOSE up -d --build
    sleep 15
    sudo $COMPOSE ps
    if curl -fs http://127.0.0.1:8000/health > /dev/null; then
      echo " API OK"
    else
      echo " API not up yet. If the genesis still has the REPLACE_WITH_... placeholders"
      echo " the node refuses to start on purpose - run the ceremony first:"
      echo "   MODE=identity bash ~/setup-validator.sh"
      echo " Otherwise check: sudo $COMPOSE logs -f node-1"
    fi
    setup_nginx
    ;;
  *)
    echo "Unknown MODE: $MODE (expected setup|identity|restart)"; exit 1 ;;
esac

echo
echo "=== Node identity ==="
cd "$REPO_DIR" 2>/dev/null || true
sudo $COMPOSE logs node-1 2>/dev/null | grep -im1 "Local peer id" \
  || echo "(PeerID not in logs yet - run: sudo $COMPOSE logs node-1 | head -40)"
