#!/bin/bash
set -e

# Script to build and push Nocostcoin Core to Docker Hub
# Usage: ./ops/push_image.sh [TAG]
# Example: ./ops/push_image.sh v0.1.0

TAG=${1:-"latest"}
IMAGE_NAME="nocostcoin/core"

echo "🐳 Building Docker Image: $IMAGE_NAME:$TAG"
cd core
docker build -t $IMAGE_NAME:$TAG .
docker tag $IMAGE_NAME:$TAG $IMAGE_NAME:latest

echo "🔑 Logging in to Docker Hub (interactive)..."
docker login

echo "🚀 Pushing Image to Registry..."
docker push $IMAGE_NAME:$TAG
docker push $IMAGE_NAME:latest

echo "✅ Successfully pushed $IMAGE_NAME:$TAG"
