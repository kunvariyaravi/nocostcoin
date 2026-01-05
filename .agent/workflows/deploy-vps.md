---
description: Deploy Nocostcoin Node to Hostinger VPS
---

# Deploy to Hostinger VPS Workflow

This workflow guides you through deploying a Nocostcoin node on a Hostinger VPS.

## Prerequisites
- GitHub account (for code deployment)
- SSH key (for VPS access)
- Hostinger VPS instance

---

## Hostinger VPS (✅ ACTIVE)

**🎉 Instance is now running on Hostinger!**
- **Public IP**: `72.62.167.94`
- **OS**: Debian 12
- **User**: `root`

### Quick Deploy

// turbo-all
```bash
# SSH to VPS
ssh root@72.62.167.94

# First time setup (run once)
cd /opt/nocostcoin/nocostcoin
bash deploy/scripts/setup-hostinger.sh

# Deploy or update
bash deploy/scripts/deploy-hostinger.sh
```

### Access Points
- **Website**: http://72.62.167.94:3000
- **Node API**: http://72.62.167.94:8000/stats
- **P2P Network**: 72.62.167.94:9000

### Monitoring
```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check status
docker compose -f docker-compose.prod.yml ps

# View stats
curl http://localhost:8000/stats
```

For detailed instructions, see [HOSTINGER_DEPLOYMENT.md](../deploy/HOSTINGER_DEPLOYMENT.md)

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
ssh root@YOUR_IP

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
# Check firewall
iptables -L -n

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
# Edit docker-compose.prod.yml
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
- Check [HOSTINGER_DEPLOYMENT.md](../deploy/HOSTINGER_DEPLOYMENT.md) for detailed troubleshooting
- Open an issue on GitHub
- Join community discussions
