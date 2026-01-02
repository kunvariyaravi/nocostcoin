# Quick Deployment Commands

This file contains copy-paste commands for quick deployment.

## Oracle Cloud (Recommended for 24/7 Free Operation)

### After SSH into Oracle Cloud instance:

```bash
# One-command setup
curl -fsSL https://raw.githubusercontent.com/yourusername/nocostcoin/main/deploy/scripts/setup-oracle-cloud.sh | bash

# Then logout/login and run:
git clone https://github.com/yourusername/nocostcoin.git
cd nocostcoin
docker-compose -f docker-compose.minimal.yml up -d

# Check status
docker-compose logs -f
```

---

## Local Testing (Your Windows Machine)

### Option 1: Docker Compose (Minimal Single Node)
```powershell
# Start single node
docker-compose -f docker-compose.minimal.yml up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 2: Native Build
```powershell
# Build
cd core
$env:LIBCLANG_PATH="C:\Program Files\LLVM\bin"
cargo build --release

# Run
.\target\release\nocostcoin.exe --port 9000 --mining true
```

---

## Render.com (Easiest, but sleeps after 15min)

### One-Click Deploy:
1. Push code to GitHub
2. Go to https://render.com/deploy
3. Connect repository
4. Render auto-detects `render.yaml`
5. Click "Apply"

### Manual Deploy:
1. Create account at render.com
2. Click "New" → "Web Service"
3. Connect GitHub repo
4. Settings:
   - **Name:** nocostcoin-node
   - **Region:** Oregon
   - **Branch:** main
   - **Runtime:** Docker
   - **Dockerfile:** render.Dockerfile
   - **Plan:** Free
5. Add env var: `RUST_LOG=info`
6. Deploy

---

## Railway.app

### Deploy:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Init project
railway init

# Deploy
railway up

# Get URL
railway domain
```

Or use web interface:
1. Go to railway.app
2. New Project → Deploy from GitHub
3. Select nocostcoin repo
4. Auto-deploys using railway.json

---

## GCP Free Tier

### Create VM:
```bash
# Create e2-micro instance (always free)
gcloud compute instances create nocostcoin-node \
  --machine-type=e2-micro \
  --zone=us-west1-b \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --tags=nocostcoin-node

# Add firewall rules
gcloud compute firewall-rules create nocostcoin-p2p \
  --allow=tcp:9000 \
  --target-tags=nocostcoin-node

gcloud compute firewall-rules create nocostcoin-api \
  --allow=tcp:8000 \
  --target-tags=nocostcoin-node

# SSH into instance
gcloud compute ssh nocostcoin-node --zone=us-west1-b

# Then run setup script
curl -fsSL https://raw.githubusercontent.com/yourusername/nocostcoin/main/deploy/scripts/setup-oracle-cloud.sh | bash
```

---

## AWS Free Tier (12 months)

### Create EC2 Instance:
```bash
# Using AWS CLI
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=nocostcoin-node}]'

# Or use EC2 Console:
# 1. Launch t2.micro with Ubuntu 22.04
# 2. Create security group with ports: 22, 8000, 9000
# 3. Download .pem key
# 4. SSH: ssh -i key.pem ubuntu@<public-ip>
# 5. Run setup script
```

---

## Digital Ocean (Paid, but reliable $4/mo)

```bash
# Create droplet via CLI
doctl compute droplet create nocostcoin-node \
  --size s-1vcpu-1gb \
  --image ubuntu-22-04-x64 \
  --region nyc1 \
  --ssh-keys <your-ssh-key-id>

# Or web interface:
# 1. Create Droplet → $4/mo Basic plan
# 2. Ubuntu 22.04
# 3. Add SSH key
# 4. Create
# 5. SSH and run setup
```

---

## Quick Health Checks

```bash
# Check if node is running
curl http://YOUR_IP:8000/stats

# Check block height
curl http://YOUR_IP:8000/chain/latest

# Check peers
curl http://YOUR_IP:8000/network/peers

# Monitor continuously
watch -n 5 'curl -s http://YOUR_IP:8000/stats | jq'

# Or use the monitor script
chmod +x deploy/scripts/monitor.sh
./deploy/scripts/monitor.sh
```

---

## Systemd Setup (Alternative to Docker)

```bash
# Build binary
cd core
cargo build --release

# Copy binary
sudo cp target/release/nocostcoin /usr/local/bin/

# Setup service
sudo cp deploy/systemd/nocostcoin.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable nocostcoin
sudo systemctl start nocostcoin

# Check status
sudo systemctl status nocostcoin
sudo journalctl -u nocostcoin -f
```

---

## Troubleshooting

```bash
# Check if ports are open
nc -zv localhost 9000
nc -zv localhost 8000

# Check Docker logs
docker logs nocostcoin-node
docker stats

# Check disk space
df -h

# Check memory
free -h

# Restart node
docker-compose restart
# or
sudo systemctl restart nocostcoin
```

---

## Cost Summary

| Platform | Monthly Cost | 24/7 Uptime | Best For |
|----------|--------------|-------------|----------|
| Oracle Cloud | $0 | ✅ Yes | Production |
| GCP Free Tier | $0 | ✅ Yes* | Testing |
| AWS Free Tier | $0 | ✅ Yes* | 12mo trial |
| Render.com | $0 or $7 | ❌ / ✅ | Quick deploy |
| Railway | ~$2-5 | ✅ Yes | Easy deploy |
| Digital Ocean | $4 | ✅ Yes | Reliable |

\* Within limits

---

**Recommendation:** Start with **Oracle Cloud Free Tier** for true 24/7 operation at $0 cost.
