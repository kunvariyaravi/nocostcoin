# Nocostcoin.com Domain Setup Guide

## Overview

This guide will help you configure **nocostcoin.com** to point to your Hostinger VPS with automatic HTTPS/SSL certificates.

**Requirements:**
- VPS IP: `72.62.167.94`
- Domain: `nocostcoin.com`
- Email for SSL notifications

---

## Step 1: Configure DNS Records

Point your domain to your VPS by adding these DNS records in your domain registrar:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `72.62.167.94` | 3600 |
| A | www | `72.62.167.94` | 3600 |

**Popular Registrars:**
- **Namecheap**: Dashboard → Domain List → Manage → Advanced DNS
- **GoDaddy**: My Products → Domains → DNS
- **Cloudflare**: DNS → Records

**Wait Time:** DNS propagation can take 5 minutes to 48 hours (usually ~15 minutes)

### Verify DNS Propagation

```bash
# From your local machine
nslookup nocostcoin.com
ping nocostcoin.com

# Should show IP: 72.62.167.94
```

---

## Step 2: Deploy Services

Before setting up the domain, ensure your services are running:

```bash
ssh root@72.62.167.94

# Navigate to project
cd /opt/nocostcoin/nocostcoin

# Deploy services
bash deploy/scripts/deploy-hostinger.sh
```

Verify services are running:
```bash
curl http://localhost:3000  # Website
curl http://localhost:8000/stats  # Node API
```

---

## Step 3: Configure Domain with SSL

Run the domain setup script:

```bash
# Make script executable
chmod +x deploy/scripts/setup-domain.sh

# Run setup (will ask for confirmation when DNS is ready)
bash deploy/scripts/setup-domain.sh
```

**What this does:**
1. ✅ Installs nginx reverse proxy
2. ✅ Obtains free SSL certificate from Let's Encrypt
3. ✅ Configures automatic HTTPS redirect
4. ✅ Sets up security headers
5. ✅ Enables gzip compression
6. ✅ Configures automatic SSL renewal
7. ✅ Updates firewall rules

**During setup:**
- The script will pause and ask you to confirm DNS is configured
- Wait until `nocostcoin.com` points to `72.62.167.94`
- Press Enter to continue

---

## Step 4: Update Website Configuration

The website needs to know it's running behind a proxy. Update the UI environment:

**Option A**: Using environment variable in docker-compose
```yaml
# Already configured in docker-compose.prod.yml
environment:
  - NEXT_PUBLIC_API_URL=http://node-1:8000
```

**Option B**: For external API access, update to use the domain:
```yaml
environment:
  - NEXT_PUBLIC_API_URL=https://nocostcoin.com/api/node
```

Restart services after any changes:
```bash
docker compose -f docker-compose.prod.yml restart ui
```

---

## Access Your Site

After setup completes, your website will be available at:

- **🌐 Main Site**: https://nocostcoin.com
- **🌐 WWW**: https://www.nocostcoin.com

Both HTTP requests will automatically redirect to HTTPS.

**API Access:**
- Through website: `https://nocostcoin.com/api/node/*`
- Direct (if needed): `http://72.62.167.94:8000/*`

---

## Nginx Configuration Details

The nginx configuration at `/etc/nginx/sites-available/nocostcoin.conf` provides:

### Security Features
- ✅ Automatic HTTP → HTTPS redirect
- ✅ TLS 1.2 and 1.3 only
- ✅ Security headers (XSS protection, clickjacking prevention)
- ✅ Content Security Policy

### Performance
- ✅ Gzip compression for faster page loads
- ✅ HTTP/2 support
- ✅ SSL session caching

### Proxying
- ✅ `/` → Next.js website (port 3000)
- ✅ `/api/node/*` → Blockchain API (port 8000)

---

## SSL Certificate Management

### Auto-Renewal

Let's Encrypt certificates expire every 90 days but renew automatically via systemd timer.

**Check renewal timer:**
```bash
systemctl list-timers | grep certbot
```

**Test renewal (dry-run):**
```bash
certbot renew --dry-run
```

**Force renewal (if needed):**
```bash
certbot renew --force-renewal
systemctl reload nginx
```

### Certificate Locations

- **Certificate**: `/etc/letsencrypt/live/nocostcoin.com/fullchain.pem`
- **Private Key**: `/etc/letsencrypt/live/nocostcoin.com/privkey.pem`
- **Logs**: `/var/log/letsencrypt/`

---

## Monitoring and Logs

### Nginx Logs

```bash
# Access logs
tail -f /var/log/nginx/nocostcoin.access.log

# Error logs
tail -f /var/log/nginx/nocostcoin.error.log

# Both
tail -f /var/log/nginx/nocostcoin.*.log
```

### Check Nginx Status

```bash
# Service status
systemctl status nginx

# Test configuration
nginx -t

# Reload configuration
systemctl reload nginx

# Restart nginx
systemctl restart nginx
```

### SSL Certificate Info

```bash
# View certificate details
certbot certificates

# Check expiration
openssl x509 -in /etc/letsencrypt/live/nocostcoin.com/cert.pem -noout -dates
```

---

## Troubleshooting

### Domain Not Resolving

```bash
# Check DNS
nslookup nocostcoin.com
dig nocostcoin.com

# Check if nginx is listening
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

**Solution**: Wait for DNS propagation or verify DNS records are correct

### SSL Certificate Error

```bash
# Check certbot logs
cat /var/log/letsencrypt/letsencrypt.log

# Verify domain is accessible on port 80
curl http://nocostcoin.com
```

**Solution**: Ensure firewall allows port 80 and domain resolves correctly

### 502 Bad Gateway

```bash
# Check if backend services are running
docker compose -f docker-compose.prod.yml ps

# Check if services are accessible
curl http://localhost:3000
curl http://localhost:8000/stats
```

**Solution**: Ensure Docker containers are running

### nginx Configuration Error

```bash
# Test config
nginx -t

# View detailed error
nginx -T
```

**Solution**: Fix syntax errors in `/etc/nginx/sites-available/nocostcoin.conf`

---

## Firewall Configuration

After domain setup, your firewall should be configured as:

```bash
# Check current rules
ufw status

# Should show:
# 80/tcp    ALLOW    Anywhere    (HTTP)
# 443/tcp   ALLOW    Anywhere    (HTTPS)
# 22/tcp    ALLOW    Anywhere    (SSH)
# 8000/tcp  ALLOW    Anywhere    (API - optional)
# 9000/tcp  ALLOW    Anywhere    (P2P)
```

**Note**: Port 3000 should NOT be publicly accessible (nginx proxies requests)

---

## Performance Optimization

### Enable Caching

Add to nginx config:
```nginx
location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 1h;
    proxy_pass http://localhost:3000;
}
```

### Enable Rate Limiting

Add to nginx config:
```nginx
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;
limit_req zone=mylimit burst=20 nodelay;
```

---

## Summary

```bash
# Complete setup flow:
1. Point nocostcoin.com to 72.62.167.94 in DNS
2. SSH to VPS: ssh root@72.62.167.94
3. Deploy services: bash deploy/scripts/deploy-hostinger.sh
4. Setup domain: bash deploy/scripts/setup-domain.sh
5. Access: https://nocostcoin.com
```

---

**Access Points After Setup:**

| Service | URL | Public |
|---------|-----|--------|
| Website | https://nocostcoin.com | ✅ Yes |
| API (proxied) | https://nocostcoin.com/api/node/* | ✅ Yes |
| API (direct) | http://72.62.167.94:8000 | ⚠️ Optional |
| P2P Network | 72.62.167.94:9000 | ✅ Yes |

**Next Steps:** Configure DNS and run the domain setup script!
