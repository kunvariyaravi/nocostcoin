# 🚀 Nocostcoin Free VPS Deployment - Summary

## ✅ What Has Been Created

You now have everything needed to deploy your Nocostcoin node on free VPS platforms! Here's what's available:

### 📚 Documentation Files
1. **`DEPLOYMENT_FREE_VPS.md`** - Comprehensive deployment guide covering:
   - 5 free VPS platform options
   - Step-by-step setup instructions
   - Monitoring and troubleshooting
   - Security best practices

2. **`deploy/QUICK_START.md`** - Copy-paste commands for:
   - Oracle Cloud setup
   - Local testing
   - Render.com deployment
   - Railway deployment
   - GCP/AWS setup
   - Quick health checks

3. **`.agent/workflows/deploy-vps.md`** - Automated workflow guide

### 🐳 Deployment Configuration Files

1. **`docker-compose.minimal.yml`** - Optimized single-node setup for 1GB RAM servers
2. **`render.Dockerfile`** - Optimized for Render.com (512MB RAM limit)
3. **`render.yaml`** - Render.com Blueprint configuration
4. **`railway.json`** - Railway.app configuration
5. **`deploy/systemd/nocostcoin.service`** - Systemd service file for native deployment

### 🛠️ Automation Scripts

1. **`deploy/scripts/setup-oracle-cloud.sh`** - One-command Oracle Cloud setup
2. **`deploy/scripts/monitor.sh`** - Node health monitoring script

### 📖 Updated Documentation

- **`README.md`** - Added deployment section with quick links

---

## 🎯 RECOMMENDED: Oracle Cloud Free Tier

**Why Oracle Cloud?**
- ✅ **Forever Free** (no expiration)
- ✅ **1GB RAM** (sufficient for single node)
- ✅ **50GB Storage** (expandable to 200GB free)
- ✅ **24/7 Uptime** (doesn't sleep)
- ✅ **Multiple Regions** (choose closest)
- ✅ **Production Grade** (enterprise infrastructure)

**Setup Time:** ~15 minutes

---

## 🚀 Quick Start Guide

### Option 1: Oracle Cloud (Best for 24/7 Operation)

#### Step 1: Create Account
1. Go to https://www.oracle.com/cloud/free/
2. Sign up (requires email + credit card for verification only)
3. Complete email verification

#### Step 2: Create Instance
1. Dashboard → Compute → Instances → **Create Instance**
2. Settings:
   - **Name:** nocostcoin-node
   - **Image:** Ubuntu 22.04 Minimal
   - **Shape:** VM.Standard.E2.1.Micro (Always Free)
   - **Boot Volume:** 50GB
3. **Download SSH private key** (important!)
4. Click **Create**

#### Step 3: Open Firewall Ports
1. Click your instance → **Subnet** → **Default Security List**
2. Add **Ingress Rules:**
   ```
   Port 9000 - TCP - 0.0.0.0/0  (P2P)
   Port 8000 - TCP - 0.0.0.0/0  (API)
   Port 3000 - TCP - 0.0.0.0/0  (UI - optional)
   ```

#### Step 4: Deploy Node
```bash
# Connect via SSH
ssh -i path/to/your-key.pem ubuntu@YOUR_PUBLIC_IP

# Run automated setup
curl -fsSL https://raw.githubusercontent.com/yourusername/nocostcoin/main/deploy/scripts/setup-oracle-cloud.sh | bash

# Logout and login (for Docker group to apply)
exit

# SSH back in
ssh -i path/to/your-key.pem ubuntu@YOUR_PUBLIC_IP

# Clone repository
git clone https://github.com/yourusername/nocostcoin.git
cd nocostcoin

# Start node
docker-compose -f docker-compose.minimal.yml up -d

# View logs
docker-compose logs -f
```

#### Step 5: Verify
```bash
# Check node status
curl http://YOUR_PUBLIC_IP:8000/stats

# Expected output: JSON with block_height, peer_count, etc.
```

**🎉 Your node is now running 24/7 for free!**

---

### Option 2: Render.com (Easiest, but sleeps after 15min)

#### Quick Deploy:
1. Push code to GitHub
2. Visit https://render.com/deploy
3. Connect repository
4. Render detects `render.yaml` → Click **Apply**
5. Wait 10-15 minutes for build

**Note:** Free tier sleeps after 15min inactivity. Upgrade to $7/mo for continuous operation.

---

### Option 3: Railway.app

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up

# Get URL
railway domain
```

**Cost:** ~$3-5/month within free credits

---

## 📊 Platform Comparison

| Platform | RAM | Storage | 24/7 | Cost | Best For |
|----------|-----|---------|------|------|----------|
| **Oracle Cloud** ⭐ | 1GB | 50GB | ✅ Yes | $0 | **Production** |
| GCP Free Tier | 1GB | 30GB | ✅ Yes* | $0 | Testing |
| AWS Free Tier | 1GB | 30GB | ✅ Yes* | $0** | 12mo Trial |
| Render.com | 512MB | 1GB | ❌ No | $0/$7 | Quick Deploy |
| Railway.app | 512MB | 1GB | ✅ Yes | ~$3 | Easy Deploy |

\* Within usage limits  
** Free for 12 months only

---

## 🔍 Monitoring Your Node

### Quick Health Check
```bash
# Check if running
curl http://YOUR_IP:8000/stats

# Get block height
curl http://YOUR_IP:8000/chain/latest

# View connected peers
curl http://YOUR_IP:8000/network/peers

# Pretty print with jq
curl -s http://YOUR_IP:8000/stats | jq
```

### Continuous Monitoring
```bash
# SSH into VPS
cd nocostcoin

# Run monitor script (checks every 30 sec)
chmod +x deploy/scripts/monitor.sh
./deploy/scripts/monitor.sh 30
```

### Setup Uptime Robot (Free Monitoring)
1. Create account at https://uptimerobot.com
2. Add Monitor:
   - Type: HTTP(s)
   - URL: `http://YOUR_IP:8000/stats`
   - Interval: 5 minutes
3. Get email/SMS alerts on downtime

---

## 🛡️ Security Checklist

```bash
# SSH into your VPS

# 1. Setup UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 9000/tcp
sudo ufw allow 8000/tcp
sudo ufw enable

# 2. Disable password authentication
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart ssh

# 3. Enable auto-updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 🐛 Common Issues & Solutions

### Issue: Can't SSH into VPS
**Solution:**
```bash
# Make key file secure
chmod 400 your-key.pem

# Use correct username (Oracle Cloud uses 'ubuntu')
ssh -i your-key.pem ubuntu@YOUR_IP
```

### Issue: API not accessible from outside
**Solution:**
```bash
# Check if firewall rules are added in cloud console
# For Oracle Cloud: VCN → Security Lists → Add Ingress Rule

# Check local firewall
sudo iptables -L -n | grep 8000

# Test locally first
curl http://localhost:8000/stats

# Then test from your machine
curl http://YOUR_PUBLIC_IP:8000/stats
```

### Issue: Node runs out of memory
**Solution:**
```bash
# Edit docker-compose.minimal.yml
nano docker-compose.minimal.yml

# Reduce mem_limit from 768m to 512m
mem_limit: 512m

# Restart
docker-compose restart
```

### Issue: Disk full
**Solution:**
```bash
# Clean Docker
docker system prune -a -f

# Clean logs
sudo journalctl --vacuum-time=3d

# Check space
df -h
```

---

## 📞 Next Steps

### 1. Join the Network
Once your node is running, share your public address:
```bash
# Get your node's peer ID
curl http://YOUR_IP:8000/node/identity

# Format: /ip4/YOUR_PUBLIC_IP/tcp/9000/p2p/YOUR_PEER_ID
```

### 2. Become a Validator
See `docs/VALIDATOR_GUIDE.md` for instructions on staking and validation.

### 3. Deploy UI (Optional)
```bash
# On same VPS, run UI
cd ui
npm install
npm run build
npm start
```

Access at: `http://YOUR_IP:3000`

### 4. Monitor Metrics
Access Prometheus metrics at: `http://YOUR_IP:9090/metrics`

---

## 🔗 Useful Commands Cheat Sheet

```bash
# SSH into VPS
ssh -i your-key.pem ubuntu@YOUR_IP

# View logs
docker-compose logs -f
docker-compose logs --tail=100 node

# Restart node
docker-compose restart

# Stop node
docker-compose down

# Check Docker stats
docker stats

# Check system resources
htop
free -h
df -h

# Pull latest code
cd ~/nocostcoin
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d

# Backup database
tar -czf nocostcoin-backup-$(date +%Y%m%d).tar.gz data/

# Restore database
tar -xzf nocostcoin-backup-YYYYMMDD.tar.gz
```

---

## 📖 Additional Resources

- **Full Deployment Guide:** [DEPLOYMENT_FREE_VPS.md](DEPLOYMENT_FREE_VPS.md)
- **Quick Commands:** [deploy/QUICK_START.md](deploy/QUICK_START.md)
- **Validator Guide:** [docs/VALIDATOR_GUIDE.md](docs/VALIDATOR_GUIDE.md)
- **Testnet Launch:** [TESTNET_LAUNCH.md](TESTNET_LAUNCH.md)
- **Whitepaper:** [WHITEPAPER.md](WHITEPAPER.md)

---

## 💡 Tips for Best Performance

1. **Choose closest region** to reduce latency
2. **Enable swap** on 1GB RAM servers:
   ```bash
   sudo fallocate -l 1G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
3. **Monitor regularly** using the monitor script
4. **Keep up to date** with `git pull` regularly
5. **Backup data** directory weekly

---

## ❓ FAQ

**Q: Will I be charged on Oracle Cloud Free Tier?**  
A: No, if you stay within Always Free resources (1 micro instance). You'll get emails if approaching limits.

**Q: Can I run multiple nodes?**  
A: Yes, but 1GB RAM can only handle 1 node comfortably. For multi-node, upgrade or use multiple free tier accounts.

**Q: How much bandwidth does a node use?**  
A: Approximately 10-30GB/month depending on network activity. Well within free tier limits.

**Q: What if my node goes offline?**  
A: Docker's `restart: unless-stopped` policy will auto-restart it. Monitor with UptimeRobot for alerts.

**Q: Can I run the UI on the same server?**  
A: Yes, but it uses additional RAM. Better to deploy UI separately on Vercel (free) or Netlify.

---

## 🎉 Success!

You now have everything needed to:
- ✅ Deploy a 24/7 Nocostcoin node for FREE
- ✅ Monitor node health
- ✅ Troubleshoot common issues
- ✅ Join the blockchain network

**Choose your platform and start deploying!**

**Recommended:** Start with **Oracle Cloud Free Tier** → Follow the Quick Start above → Deploy in 15 minutes!

---

**Need Help?**  
- 📖 Read the full guides
- 🐛 Open a GitHub issue
- 💬 Join community discussions

**Happy validating! 🚀**
