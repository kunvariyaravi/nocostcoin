# Nocostcoin Hostinger VPS Deployment Guide

## Overview

This guide covers deploying both the **Nocostcoin blockchain node** and **Next.js website** to your Hostinger VPS using Docker Compose.

**VPS Details:**
- IP Address: `72.62.167.94`
- OS: Debian 12
- User: `root`

---

## Prerequisites

- SSH access to your Hostinger VPS
- Git repository with latest code
- Minimum 2GB RAM, 2 vCPUs recommended

---

## Initial Setup (One-Time)

### 1. SSH into Your VPS

```bash
ssh root@72.62.167.94
```

### 2. Download and Run Setup Script

```bash
# Download the setup script
curl -O https://raw.githubusercontent.com/kunvariyaravi/nocostcoin/main/deploy/scripts/setup-hostinger.sh

# Make it executable
chmod +x setup-hostinger.sh

# Run the setup (requires root)
sudo bash setup-hostinger.sh
```

**What the setup script does:**
- Updates system packages
- Installs Docker and Docker Compose
- Configures UFW firewall (ports 22, 80, 443, 3000, 8000, 9000)
- Installs essential tools (git, curl, wget, htop)
- Clones the Nocostcoin repository to `/opt/nocostcoin`
- Creates necessary directories

### 3. Verify Docker Installation

```bash
docker --version
docker compose version
```

---

## Deployment

### Deploy/Update Nocostcoin

Navigate to the project directory and run the deployment script:

```bash
cd /opt/nocostcoin/nocostcoin
bash deploy/scripts/deploy-hostinger.sh
```

**What the deployment script does:**
- Pulls latest code from GitHub
- Stops existing containers gracefully
- Builds fresh Docker images
- Starts all services (node + website)
- Runs health checks
- Displays access URLs

---

## Access Your Deployment

After successful deployment, your services will be available at:

| Service | URL | Description |
|---------|-----|-------------|
| **Website** | http://72.62.167.94:3000 | Nocostcoin testnet dashboard and explorer |
| **Node API** | http://72.62.167.94:8000 | Blockchain node REST API |
| **P2P Network** | 72.62.167.94:9000 | Peer-to-peer network port |

---

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Node only
docker compose -f docker-compose.prod.yml logs -f node-1

# Website only
docker compose -f docker-compose.prod.yml logs -f ui

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100
```

### Check Service Status

```bash
# Container status
docker compose -f docker-compose.prod.yml ps

# Resource usage
docker stats

# Health check
curl http://localhost:8000/stats
curl http://localhost:3000
```

### Restart Services

```bash
# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart node-1
docker compose -f docker-compose.prod.yml restart ui
```

### Stop Services

```bash
# Stop all services
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: deletes data)
docker compose -f docker-compose.prod.yml down -v
```

### Update to Latest Version

Simply run the deployment script again:

```bash
cd /opt/nocostcoin/nocostcoin
bash deploy/scripts/deploy-hostinger.sh
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check Docker daemon
systemctl status docker

# Check logs for errors
docker compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Check memory
free -h
```

### Website Can't Connect to Node

```bash
# Verify node is running
docker compose -f docker-compose.prod.yml ps node-1

# Check node API
curl http://localhost:8000/stats

# Check network connectivity
docker network ls
docker network inspect nocostcoin_nocostcoin-network
```

### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :8000
sudo lsof -i :9000

# Kill the process if needed
sudo kill -9 <PID>
```

### Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Clear Docker cache
docker system prune -a

# Restart Docker
systemctl restart docker
```

### Firewall Blocking Access

```bash
# Check UFW status
sudo ufw status

# Re-open required ports
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 9000/tcp
```

---

## Performance Optimization

### Reduce Memory Usage

Edit `docker-compose.prod.yml` and adjust resource limits:

```yaml
deploy:
  resources:
    limits:
      memory: 512M  # Reduce from 1G
```

### Enable Log Rotation

```bash
# Add to /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker
systemctl restart docker
```

---

## Backup and Recovery

### Backup Blockchain Data

```bash
# Create backup
tar -czf nocostcoin-backup-$(date +%Y%m%d).tar.gz data/node-1

# Download to local machine
scp root@72.62.167.94:/opt/nocostcoin/nocostcoin/nocostcoin-backup-*.tar.gz ./
```

### Restore from Backup

```bash
# Stop services
docker compose -f docker-compose.prod.yml down

# Extract backup
tar -xzf nocostcoin-backup-*.tar.gz

# Start services
docker compose -f docker-compose.prod.yml up -d
```

---

## SSL/HTTPS Setup (Optional)

To enable HTTPS with a custom domain:

1. **Point your domain to the VPS IP**
   - Add an A record pointing to `72.62.167.94`

2. **Install nginx and certbot**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   ```

3. **Configure nginx reverse proxy**
   - Create nginx config for your domain
   - Proxy port 80/443 to internal port 3000

4. **Get SSL certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Useful Commands Reference

```bash
# Quick redeploy
cd /opt/nocostcoin/nocostcoin && bash deploy/scripts/deploy-hostinger.sh

# View real-time logs
docker compose -f docker-compose.prod.yml logs -f --tail=50

# Execute command in container
docker compose -f docker-compose.prod.yml exec node-1 sh

# Check API stats
curl -s http://localhost:8000/stats | jq

# Monitor resource usage
watch -n 2 docker stats --no-stream
```

---

## Support

For issues or questions:
- Check logs: `docker compose -f docker-compose.prod.yml logs`
- GitHub Issues: https://github.com/kunvariyaravi/nocostcoin/issues
- Review deployment plan: [implementation_plan.md]

---

**Last Updated:** 2026-01-03
