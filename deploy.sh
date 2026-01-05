#!/bin/bash
set -e

# Nocostcoin Deployment Wrapper for Hostinger
# This script is a convenience wrapper around the granular scripts in deploy/scripts/

echo "🚀 Nocostcoin Hostinger Deployment"
echo "=================================="

# Check if we are in the correct directory
if [ ! -d "deploy/scripts" ]; then
    echo "❌ Error: deploy/scripts directory not found."
    echo "Please run this script from the root of the nocostcoin repository."
    exit 1
fi

chmod +x deploy/scripts/*.sh

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Docker not found. Running initial setup..."
    bash deploy/scripts/setup-hostinger.sh
    
    # After setup, we might need to reload shell or re-check, 
    # but setup-hostinger should handle installation.
    # We exit here to let user handle group changes/re-login if needed
    echo "✅ Setup script completed. You may need to log out and log back in for Docker group permissions."
    echo "Then run this script again to deploy."
    exit 0
fi

echo "✅ Docker is installed via setup. Proceeding to deploy..."
bash deploy/scripts/deploy-hostinger.sh

echo ""
echo "For more options, see deploy/HOSTINGER_DEPLOYMENT.md"
