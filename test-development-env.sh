#!/bin/bash

echo "========================================"
echo "   MiniCDE Development Environment Test"
echo "========================================"
echo ""

# Check if Docker is running
echo "[1/5] Checking Docker status..."
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo "   You can start it manually or run: start-docker.bat"
    exit 1
fi
echo "✅ Docker is running"

# Stop any existing containers
echo "[2/5] Stopping existing containers..."
docker-compose down >/dev/null 2>&1
docker-compose -f docker-compose.dev.yml down >/dev/null 2>&1
echo "✅ Stopped existing containers"

# Build and start development environment
echo "[3/5] Building and starting development environment..."
docker-compose -f docker-compose.dev.yml up -d --build

# Wait for containers to start
echo "[4/5] Waiting for containers to start..."
sleep 10

# Check container status
echo "[5/5] Checking container status..."
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "========================================"
echo "   Development Environment Started!"
echo "========================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo "Database: localhost:5432"
echo "Redis: localhost:6379"
echo ""
echo "Features:"
echo "- Hot reload enabled"
echo "- Debug mode enabled"
echo "- Source maps enabled"
echo "- Volume mounting for live code changes"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.dev.yml logs -f"
echo ""
echo "To stop:"
echo "  docker-compose -f docker-compose.dev.yml down"
echo "" 