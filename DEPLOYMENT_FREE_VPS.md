# Deploying Nocostcoin Node on Free VPS Platforms

This guide covers deploying a continuous Nocostcoin blockchain node on free VPS/cloud platforms.

## 🎯 Best Free VPS Options for Continuous Nodes

### Option 1: Oracle Cloud Free Tier (RECOMMENDED ⭐)
**Specs:** 1-4 OCPUs, 1-24GB RAM, 200GB storage  
**Duration:** Forever free (no credit card expiration)  
**Regions:** Multiple worldwide  
**Best For:** Production-grade continuous node  

### Option 2: Google Cloud Platform (GCP) Free Tier
**Specs:** e2-micro VM (0.25-2 vCPUs, 1GB RAM, 30GB storage)  
**Duration:** $300 credit for 90 days + always-free tier  
**Best For:** Testing and development  

### Option 3: AWS Free Tier
**Specs:** t2.micro (1 vCPU, 1GB RAM, 30GB storage)  
**Duration:** 12 months free  
**Best For:** Short-term testing  

### Option 4: Render.com (Docker-based)
**Specs:** 512MB RAM, shared CPU  
**Duration:** Free tier with sleep after inactivity  
**Best For:** Quick deployment, minimal config  

### Option 5: Railway.app
**Specs:** $5 monthly credit (sufficient for small node)  
**Duration:** Monthly renewal  
**Best For:** Easy deployment from GitHub  

---

## 🚀 Quick Deploy Guide

### Method 1: Deploy to Oracle Cloud (Recommended)

#### Step 1: Create Oracle Cloud Account
1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Sign up for free tier account (requires credit card for verification only)
3. Verify your email and complete setup

#### Step 2: Create Compute Instance
1. Navigate to **Compute** → **Instances** → **Create Instance**
2. Select:
   - **Name:** nocostcoin-node-1
   - **Image:** Ubuntu 22.04 Minimal
   - **Shape:** VM.Standard.E2.1.Micro (always free)
   - **Boot Volume:** 50GB (expandable to 200GB free)
3. **Download** the SSH private key (`.pem` file)
4. Click **Create**

#### Step 3: Configure Firewall
1. Click on your instance → **Attached VNICs** → **Subnet** → **Default Security List**
2. Add **Ingress Rules:**
   - Port 9000 (P2P) - TCP - 0.0.0.0/0
   - Port 8000 (API) - TCP - 0.0.0.0/0
   - Port 3000 (UI) - TCP - 0.0.0.0/0
   - Port 9090 (Metrics) - TCP - 0.0.0.0/0

#### Step 4: Connect via SSH
```bash
# Make key secure (Linux/Mac)
chmod 400 ~/Downloads/your-key.pem
ssh -i ~/Downloads/your-key.pem ubuntu@<INSTANCE_PUBLIC_IP>

# Windows (Use Git Bash or WSL)
ssh -i C:\Users\YourName\Downloads\your-key.pem ubuntu@<INSTANCE_PUBLIC_IP>
```

#### Step 5: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install -y git

# Logout and login again for Docker group to apply
exit
# SSH back in
```

#### Step 6: Deploy Nocostcoin Node
```bash
# Clone repository
git clone https://github.com/yourusername/nocostcoin.git
cd nocostcoin

# Create data directories
mkdir -p data/node-1 data/node-2 data/node-3

# Start single node (lightweight for free tier)
docker-compose up -d node-1

# Check logs
docker-compose logs -f node-1
```

#### Step 7: Keep Node Running
```bash
# Node will auto-restart on failure
# To ensure it runs on server reboot:
sudo systemctl enable docker

# Monitor node health
docker ps
docker-compose logs --tail=50 node-1
```

---

### Method 2: Deploy to Render.com (Easiest)

#### Prerequisites
1. Push your code to GitHub
2. Create account at [render.com](https://render.com)

#### Step 1: Create Web Service
1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name:** nocostcoin-node
   - **Region:** Choose closest
   - **Branch:** main
   - **Root Directory:** `core`
   - **Runtime:** Docker
   - **Plan:** Free
   - **Advanced:**
     - Add environment variable: `RUST_LOG=info`

#### Step 2: Custom Dockerfile for Render
Create `render.Dockerfile` in project root:
```dockerfile
# Optimized for Render's 512MB RAM limit
FROM rust:1.75-slim as builder

WORKDIR /app
COPY core/Cargo.toml core/Cargo.lock ./
COPY core/src ./src

# Install minimal dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl-dev pkg-config && \
    rm -rf /var/lib/apt/lists/*

# Build with minimal profile
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libssl3 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/nocostcoin /usr/local/bin/

EXPOSE 9000 8000
CMD ["nocostcoin", "--port", "9000"]
```

#### Step 3: Deploy
1. Click **Create Web Service**
2. Wait for build (10-15 minutes)
3. Node will be available at: `https://nocostcoin-node.onrender.com`

**Note:** Free tier sleeps after 15 min inactivity. Upgrade to $7/month for continuous operation.

---

### Method 3: Deploy to Railway.app

#### Step 1: Setup
1. Visit [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select your `nocostcoin` repository

#### Step 2: Configure
1. Select `core` as root directory
2. Railway auto-detects Dockerfile
3. Add environment variables:
   - `RUST_LOG=info`
   - `PORT=8000`
4. Click **Deploy**

#### Step 3: Configure Networking
1. Go to **Settings** → **Networking**
2. Enable public networking
3. Note your public URL

---

## 🔧 Production Configuration

### Single Node Configuration (Minimal Resources)
For servers with <2GB RAM, run a single validator:

```bash
# Use this docker-compose.minimal.yml
docker-compose -f docker-compose.minimal.yml up -d
```

### Create `docker-compose.minimal.yml`:
```yaml
version: '3.8'

services:
  node:
    build: ./core
    ports:
      - "9000:9000"
      - "8000:8000"
      - "9090:9090"
    volumes:
      - ./data:/usr/local/bin/data
    command: ["./nocostcoin", "--port", "9000", "--mining", "true"]
    environment:
      - RUST_LOG=info
    restart: unless-stopped
    mem_limit: 768m
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/stats"]
      interval: 60s
      timeout: 10s
      retries: 5
```

### Systemd Service (Alternative to Docker)

Create `/etc/systemd/system/nocostcoin.service`:
```ini
[Unit]
Description=Nocostcoin Blockchain Node
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/nocostcoin/core
ExecStart=/home/ubuntu/nocostcoin/target/release/nocostcoin --port 9000 --mining true
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="RUST_LOG=info"

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable nocostcoin
sudo systemctl start nocostcoin
sudo journalctl -u nocostcoin -f
```

---

## 🔍 Monitoring Your Node

### Check Node Status
```bash
# Via API
curl http://YOUR_IP:8000/stats

# Check block height
curl http://YOUR_IP:8000/chain/latest

# View peers
curl http://YOUR_IP:8000/network/peers

# Prometheus metrics
curl http://YOUR_IP:9090/metrics
```

### Setup Monitoring Dashboard

#### Option 1: Basic Health Check Script
Create `monitor.sh`:
```bash
#!/bin/bash
while true; do
  STATS=$(curl -s http://localhost:8000/stats)
  BLOCK=$(echo $STATS | jq -r '.block_height')
  PEERS=$(echo $STATS | jq -r '.peer_count')
  echo "[$(date)] Block: $BLOCK | Peers: $PEERS"
  sleep 30
done
```

Run in background:
```bash
chmod +x monitor.sh
nohup ./monitor.sh > monitor.log 2>&1 &
```

#### Option 2: Uptime Monitoring
Use free services like:
- **UptimeRobot** ([uptimerobot.com](https://uptimerobot.com))
- **Better Uptime** ([betteruptime.com](https://betteruptime.com))

Add monitor for: `http://YOUR_IP:8000/stats`

---

## 🌐 Connecting to Existing Network

### Join as Validator
If connecting to an existing testnet:

```bash
# Get bootstrap node address from network coordinator
BOOTSTRAP="/ip4/BOOTSTRAP_IP/tcp/9000"

# Start your node
docker run -d \
  -p 9000:9000 \
  -p 8000:8000 \
  -v $(pwd)/data:/data \
  --restart unless-stopped \
  nocostcoin-node \
  ./nocostcoin --port 9000 --bootstrap $BOOTSTRAP
```

### Register as Validator
```bash
# Get your node's public key
curl http://localhost:8000/node/identity

# Share your node's public address
# Format: /ip4/YOUR_PUBLIC_IP/tcp/9000/p2p/YOUR_PEER_ID
```

---

## ⚡ Performance Optimization

### For 1GB RAM Servers
```bash
# Limit memory usage
docker run --memory="768m" --memory-swap="1g" ...

# Reduce logging
RUST_LOG=warn

# Optimize RocksDB
# Add to config file:
[storage]
max_open_files = 100
write_buffer_size = 16777216  # 16MB instead of 64MB
```

### For Network Bandwidth Limits
```bash
# Reduce peer connections
--max-peers 10

# Reduce gossipsub mesh size
# Modify network.rs configuration
```

---

## 🛡️ Security Best Practices

### 1. Firewall Setup (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 9000/tcp  # P2P
sudo ufw allow 8000/tcp  # API
sudo ufw enable
```

### 2. SSH Hardening
```bash
# Disable password auth
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart ssh
```

### 3. Auto-Updates
```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Fail2ban
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 📊 Cost Comparison

| Platform | RAM | vCPU | Storage | Cost | Duration |
|----------|-----|------|---------|------|----------|
| Oracle Cloud | 1GB | 1 | 50GB | $0 | Forever |
| GCP | 1GB | 0.25 | 30GB | $0 | Forever* |
| AWS | 1GB | 1 | 30GB | $0 | 12 months |
| Render | 512MB | Shared | 1GB | $0** | Forever |
| Railway | 512MB | Shared | 1GB | ~$2/mo | Monthly |

\* Always-free tier exists but with limits  
** Sleeps after inactivity on free tier

---

## 🐛 Troubleshooting

### Node Won't Start
```bash
# Check logs
docker-compose logs -f node-1

# Common issues:
# 1. Port already in use
sudo lsof -i :9000

# 2. Permission denied
sudo chown -R $USER:$USER data/

# 3. Out of memory
docker stats
```

### Can't Connect to Peers
```bash
# Check firewall
sudo ufw status

# Test connectivity
nc -zv PEER_IP 9000

# Check NAT/port forwarding in cloud console
```

### Sync Issues
```bash
# Clear database and resync
rm -rf data/nocostcoin_db*
docker-compose restart node-1
```

---

## 📞 Next Steps

1. **Deploy** your node using one of the methods above
2. **Monitor** using the provided scripts
3. **Join** the community and share your node's public address
4. **Contribute** by improving the documentation

---

## 🔗 Useful Links

- [Nocostcoin Repository](https://github.com/yourusername/nocostcoin)
- [Whitepaper](../WHITEPAPER.md)
- [Testnet Launch Guide](../TESTNET_LAUNCH.md)
- [Validator Guide](../docs/VALIDATOR_GUIDE.md)

---

**Questions?** Open an issue on GitHub or join our community discussions!

**⚠️ Note:** Free tier services may have limitations. For production validators with stake, consider paid hosting for reliability.
