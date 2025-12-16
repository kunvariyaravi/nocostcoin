#!/bin/bash
echo "Starting Nocostcoin..."

if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker and try again."
    exit 1
fi

echo "Building and starting containers..."
docker-compose up -d --build

echo ""
echo "Services started!"
echo "UI: http://localhost:3000"
echo "API: http://localhost:8000"
echo ""
