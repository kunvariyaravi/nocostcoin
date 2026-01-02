---
description: Deploy Nocostcoin Node to Free VPS
---

# Deploy to Free VPS Workflow

This workflow guides you through deploying a Nocostcoin node on a free VPS platform.

## Prerequisites
- GitHub account (for code deployment)
- SSH key (for VPS access)
- Credit card (only for verification, no charges on free tiers)

---

## Option 1: Oracle Cloud Free Tier (✅ DEPLOYED)

**🎉 Instance `nocostcoin-node` is now running!**
- **Public IP**: `80.225.208.120`
- **Region**: India West (Mumbai)

| Platform | Tier/Specs | RAM | vCPUs | IP Address | User | Actions |
|---|---|---|---|---|---|---|
| Oracle Cloud | VM.Standard.E2.1.Micro | 1GB | 2 | `80.225.208.120` | `opc` | [Guide](#oracle-cloud-always-free) |
- **OS**: Oracle Linux
- **Username**: `opc`

### Connection Information
See [VPS_CONNECTION_INFO.md](./VPS_CONNECTION_INFO.md) for detailed connection instructions.

Quick SSH access:
```bash
ssh -i C:\Users\DELL\Downloads\ssh-key-2025-01-01.key opc@140.245.28.100
```

### Step 1: Initial Server Setup
// turbo-all
```bash
# Connect to the instance
ssh -i C:\Users\DELL\Downloads\ssh-key-2025-01-01.key opc@140.245.28.100

# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker opc

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configure firewall (Oracle Linux uses iptables)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3001 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT
sudo service iptables save

# Logout and login for Docker group to apply
exit
```

### Step 2: Deploy NocostCoin Node
```bash
# SSH back in
ssh -i C:\Users\DELL\Downloads\ssh-key-2025-01-01.key opc@140.245.28.100

# Clone repository
git clone https://github.com/kunvariyaravi/nocostcoin.git
cd nocostcoin

# Start services
docker-compose up -d

# Check status
docker ps
docker-compose logs -f
```

### Step 3: Verify Deployment
```bash
# Check node API (locally)
curl http://localhost:3000/api/node/info

# Check node API (externally, from your local machine)
curl http://140.245.28.100:3000/api/node/info

# View logs
docker-compose logs -f core
docker-compose logs -f ui
```

### Access Points
- **Node API**: http://140.245.28.100:3000
- **Web UI**: http://140.245.28.100:3001
- **P2P Network**: 140.245.28.100:8080

---

## Option 2: Render.com (Easiest Setup)

### Step 1: Push to GitHub
```bash
# Ensure latest code is on GitHub
git add .
git commit -m "Add deployment configs"
git push origin main
```

### Step 2: Deploy on Render
1. Visit https://render.com/deploy
2. Connect GitHub account
3. Select `nocostcoin` repository
4. Render auto-detects `render.yaml`
5. Click "Apply"
6. Wait 10-15 minutes for build

**Note:** Free tier sleeps after 15min inactivity. Upgrade to $7/mo for continuous operation.

---

## Option 3: Railway.app

### Step 1: Deploy via CLI
// turbo-all
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Get URL
railway domain
```

### Step 2: Or Deploy via Web
1. Visit https://railway.app
2. New Project → Deploy from GitHub
3. Select `nocostcoin` repository
4. Railway auto-deploys using `railway.json`

---

## Option 4: GCP Free Tier

### Deploy via gcloud CLI
// turbo-all
```bash
# Create VM instance
gcloud compute instances create nocostcoin-node \
  --machine-type=e2-micro \
  --zone=us-west1-b \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --tags=nocostcoin

# Configure firewall
gcloud compute firewall-rules create nocostcoin-p2p --allow=tcp:9000 --target-tags=nocostcoin
gcloud compute firewall-rules create nocostcoin-api --allow=tcp:8000 --target-tags=nocostcoin

# SSH and setup
gcloud compute ssh nocostcoin-node --zone=us-west1-b
curl -fsSL https://raw.githubusercontent.com/yourusername/nocostcoin/main/deploy/scripts/setup-oracle-cloud.sh | bash
```

---

## Monitoring Your Deployed Node

### Basic Health Check
```bash
# Check stats
curl http://YOUR_IP:8000/stats

# Pretty print with jq
curl -s http://YOUR_IP:8000/stats | jq

# Check latest block
curl http://YOUR_IP:8000/chain/latest

# View peers
curl http://YOUR_IP:8000/network/peers
```

### Continuous Monitoring
```bash
# SSH into your VPS
ssh ubuntu@YOUR_IP

# Run monitor script
cd nocostcoin
chmod +x deploy/scripts/monitor.sh
./deploy/scripts/monitor.sh 30  # Check every 30 seconds

# Or use watch + curl
watch -n 30 'curl -s http://localhost:8000/stats | jq'
```

### Setup Uptime Monitoring
1. Visit https://uptimerobot.com (free)
2. Add New Monitor:
   - Type: HTTP(s)
   - URL: `http://YOUR_IP:8000/stats`
   - Interval: 5 minutes
3. Get email alerts on downtime

---

## Troubleshooting

### Node won't start
```bash
# Check Docker logs
docker-compose logs -f

# Check if ports are in use
sudo lsof -i :9000
sudo lsof -i :8000

# Restart
docker-compose restart
```

### Can't connect to API
```bash
# Check firewall (Oracle Cloud)
sudo iptables -L -n

# Check if service is listening
netstat -tulpn | grep 8000

# Test locally first
curl http://localhost:8000/stats

# Then test externally
curl http://YOUR_PUBLIC_IP:8000/stats
```

### Out of memory
```bash
# Check memory usage
free -h
docker stats

# Reduce memory limits
# Edit docker-compose.minimal.yml:
# mem_limit: 512m  # Reduce from 768m
```

### Disk full
```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a

# Clean logs
docker-compose logs --tail=0
```

---

## Next Steps

✅ Node is running  
✅ API is accessible  
✅ Monitoring is setup  

Now:
1. Share your node's public address with the community
2. Join as a validator (see docs/VALIDATOR_GUIDE.md)
3. Monitor metrics at http://YOUR_IP:9090
4. Deploy UI at http://YOUR_IP:3000

---

**Need Help?** 
- Check [DEPLOYMENT_FREE_VPS.md](../DEPLOYMENT_FREE_VPS.md) for detailed troubleshooting
- Open an issue on GitHub
- Join community discussions
