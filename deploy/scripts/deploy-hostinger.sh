#!/bin/bash

# Nocostcoin Hostinger Deployment Script
# This script deploys/updates the Nocostcoin node and website

set -e

echo "=================================="
echo "Nocostcoin Deployment"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me)

echo -e "${YELLOW}Step 1: Pulling latest code from GitHub...${NC}"
git fetch origin
git pull origin main

echo -e "${YELLOW}Step 2: Stopping existing containers...${NC}"
docker compose -f docker-compose.prod.yml down || true

echo -e "${YELLOW}Step 3: Cleaning up old images (optional)...${NC}"
# Uncomment the line below to remove old images and free up space
# docker image prune -af

echo -e "${YELLOW}Step 4: Building Docker images...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache

echo -e "${YELLOW}Step 5: Starting services...${NC}"
docker compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}Step 6: Waiting for services to be healthy...${NC}"
sleep 10

echo -e "${YELLOW}Step 7: Checking service status...${NC}"
docker compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}=================================="
echo "✓ Deployment Complete!"
echo "==================================${NC}"
echo ""
echo -e "${BLUE}Service Status:${NC}"
docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo "  🌐 Website:  http://${PUBLIC_IP}:3000"
echo "  🔗 Node API: http://${PUBLIC_IP}:8000"
echo "  📡 P2P:      ${PUBLIC_IP}:9000"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  View logs:        docker compose -f docker-compose.prod.yml logs -f"
echo "  View node logs:   docker compose -f docker-compose.prod.yml logs -f node-1"
echo "  View UI logs:     docker compose -f docker-compose.prod.yml logs -f ui"
echo "  Restart all:      docker compose -f docker-compose.prod.yml restart"
echo "  Stop all:         docker compose -f docker-compose.prod.yml down"
echo "  Check stats:      curl http://localhost:8000/stats"
echo ""
echo -e "${YELLOW}Testing API...${NC}"
if curl -f http://localhost:8000/stats > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Node API is responding${NC}"
else
    echo -e "${RED}✗ Node API is not responding yet (may need more time to start)${NC}"
fi

echo ""
echo -e "${YELLOW}Testing Website...${NC}"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Website is responding${NC}"
else
    echo -e "${RED}✗ Website is not responding yet (may need more time to start)${NC}"
fi

echo ""
echo -e "${GREEN}Deployment finished! Monitor logs with:${NC}"
echo -e "${BLUE}docker compose -f docker-compose.prod.yml logs -f${NC}"
echo ""
