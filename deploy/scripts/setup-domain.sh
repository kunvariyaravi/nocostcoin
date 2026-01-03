#!/bin/bash

# Nocostcoin Domain Setup Script
# Configures nginx reverse proxy and SSL for nocostcoin.com

set -e

DOMAIN="nocostcoin.com"
EMAIL="your-email@example.com"  # Change this to your email

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=================================="
echo "Nocostcoin Domain Setup"
echo "Domain: $DOMAIN"
echo "=================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing nginx...${NC}"
apt-get update
apt-get install -y nginx

echo -e "${YELLOW}Step 2: Installing certbot for Let's Encrypt SSL...${NC}"
apt-get install -y certbot python3-certbot-nginx

echo -e "${YELLOW}Step 3: Copying nginx configuration...${NC}"
cp deploy/nginx/nocostcoin.conf /etc/nginx/sites-available/nocostcoin.conf

echo -e "${YELLOW}Step 4: Creating temporary config for SSL certificate...${NC}"
# Create a temporary nginx config without SSL for initial certificate generation
cat > /etc/nginx/sites-available/nocostcoin-temp.conf << 'EOF'
server {
    listen 80;
    server_name nocostcoin.com www.nocostcoin.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Enable temp config
ln -sf /etc/nginx/sites-available/nocostcoin-temp.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx

echo -e "${YELLOW}Step 5: Obtaining SSL certificate from Let's Encrypt...${NC}"
echo -e "${YELLOW}Note: Make sure $DOMAIN is pointing to this server's IP (72.62.167.94)${NC}"
echo ""
read -p "Press Enter to continue once DNS is configured..."

# Obtain certificate
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

echo -e "${YELLOW}Step 6: Installing final nginx configuration...${NC}"
# Remove temp config and install final one
rm -f /etc/nginx/sites-enabled/nocostcoin-temp.conf
ln -sf /etc/nginx/sites-available/nocostcoin.conf /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx

echo -e "${YELLOW}Step 7: Setting up automatic SSL renewal...${NC}"
# Test renewal
certbot renew --dry-run

# Certbot automatically sets up a systemd timer for renewal

echo -e "${YELLOW}Step 8: Configuring firewall...${NC}"
ufw allow 'Nginx Full'
ufw delete allow 3000/tcp  # Remove direct access to port 3000

echo ""
echo -e "${GREEN}=================================="
echo "✓ Domain Setup Complete!"
echo "==================================${NC}"
echo ""
echo -e "${GREEN}Your website is now available at:${NC}"
echo -e "${GREEN}https://$DOMAIN${NC}"
echo -e "${GREEN}https://www.$DOMAIN${NC}"
echo ""
echo "SSL certificate will auto-renew every 90 days."
echo ""
echo "Useful commands:"
echo "  - Check nginx status: systemctl status nginx"
echo "  - View nginx logs: tail -f /var/log/nginx/nocostcoin.error.log"
echo "  - Test SSL renewal: certbot renew --dry-run"
echo "  - Reload nginx: systemctl reload nginx"
echo ""
