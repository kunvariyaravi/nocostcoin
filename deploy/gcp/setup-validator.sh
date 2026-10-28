#!/bin/bash
# Nocostcoin GCP validator setup - runs ON the VM (Ubuntu 22.04).
#
# Env:
#   DOMAIN=your.domain.com          (optional - enables nginx + Let's Encrypt)
#   NOCOSTCOIN_API_TOKEN=<secret>   (recommended - protects write endpoints)
#   NOCOSTCOIN_IMAGE=<image>        (optional - pull this image instead of
#                                    building from ./core; use on a small VM
#                                    where the RocksDB build would OOM)
#   MODE=setup|identity|restart     (default: setup)
#   RUN_TESTS=1                     (optional - runs the Rust test suite in Docker,
#                                    only meaningful when building locally)
#
# Modes:
#   setup     install Docker, fetch the code, start the node
#   identity  print this node's validator pubkey + wallet address (the ceremony)
#   restart   restart after the genesis file has been updated
#
# Safe to re-run: it pulls the latest code and restarts.
set -e

DOMAIN="${DOMAIN:-}"
MODE="${MODE:-setup}"
IMAGE="${NOCOSTCOIN_IMAGE:-}"
# Exported so `sudo -E docker compose` sees it: without it compose falls back to
# the local image name, finds it missing, and starts building RocksDB on the VM
# instead of using the prebuilt image.
export NOCOSTCOIN_IMAGE="$IMAGE"
REPO_DIR=/opt/nocostcoin/nocostcoin
COMPOSE="docker compose -f docker-compose.gcp-validator.yml"

ensure_swap() {
  # The Always Free e2-micro has 1 GB of RAM. A swap file keeps Docker and the
  # node from being OOM-killed, and lets a local RocksDB build finish rather
  # than dying part way through.
  if [ -f /swapfile ]; then return; fi
  echo "=== Adding a 2G swap file (small VM) ==="
  sudo fallocate -l 2G /swapfile 2>/dev/null \
    || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile > /dev/null
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
}

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
  # it is reachable through nginx only.
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

# Log Docker in to Artifact Registry using the VM's own service account, read
# straight from the metadata server - no gcloud install needed on the VM.
docker_login_ar() {
  local registry="${IMAGE%%/*}"
  local token
  token=$(curl -fsS -H "Metadata-Flavor: Google" \
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" \
    | sed -n 's/.*"access_token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
  if [ -z "$token" ]; then
    echo "WARNING: no metadata token available - assuming docker is already logged in"
    return 0
  fi
  echo "$token" | sudo docker login -u oauth2accesstoken --password-stdin "https://${registry}"
}

# Make the image available locally: pull it when NOCOSTCOIN_IMAGE is set,
# otherwise build it here from ./core.
ensure_image() {
  cd "$REPO_DIR"
  if [ -n "$IMAGE" ]; then
    echo "=== Pulling prebuilt image: $IMAGE ==="
    docker_login_ar
    sudo docker pull "$IMAGE"
  else
    echo "=== Building the node image on this VM ==="
    sudo $COMPOSE build node-1
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
  ensure_image
  # -E so the compose interpolation still sees NOCOSTCOIN_IMAGE.
  sudo -E $COMPOSE run --rm node-1 --config config/mainnet-gcp.toml --identity
}

start_node() {
  cd "$REPO_DIR"
  sudo -E $COMPOSE down 2>/dev/null || true
  if [ -n "$IMAGE" ]; then
    sudo -E $COMPOSE up -d --no-build
  else
    sudo -E $COMPOSE up -d --build
  fi
}

reset_chain() {
  # Wipe the chain database so the node starts from the genesis again.
  #
  # The validator key, the wallet key and the libp2p identity are kept: they
  # are this node's identity, and the genesis references the keys they
  # produced. Only the chain history is thrown away.
  cd "$REPO_DIR"
  echo "=== Resetting the chain database ==="
  sudo -E $COMPOSE down 2>/dev/null || true
  sudo rm -rf ./data/validator/nocostcoin_db_9000
  echo "Chain database removed. The validator key, wallet key and libp2p identity were kept."
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
    sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" \
      || echo "certbot failed - ensure the DNS A record points at this VM, then re-run certbot manually"
    echo "API: https://${DOMAIN}/stats"
  else
    echo "DOMAIN not set - skipping nginx."
    echo "The API is loopback-only on this VM. Tunnel it from your machine:"
    echo "  gcloud compute ssh nocostcoin-validator -- -L 8000:localhost:8000"
  fi
}

ensure_swap
install_docker
fetch_code

case "$MODE" in
  identity)
    print_identity
    ;;
  restart)
    ensure_image
    start_node
    ;;
  reset)
    # Throw the chain away and start again from the genesis. Used when the
    # genesis changes and the old chain is no longer compatible.
    reset_chain
    ensure_image
    start_node
    ;;
  setup)
    cd "$REPO_DIR"
    if [ "${RUN_TESTS:-0}" = "1" ]; then run_tests; fi
    ensure_image
    start_node
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
    echo "Unknown MODE: $MODE (expected setup|identity|restart|reset)"; exit 1 ;;
esac

echo
echo "=== Node identity ==="
cd "$REPO_DIR" 2>/dev/null || true
sudo $COMPOSE logs node-1 2>/dev/null | grep -im1 "Local peer id" \
  || echo "(PeerID not in logs yet - run: sudo $COMPOSE logs node-1 | head -40)"
