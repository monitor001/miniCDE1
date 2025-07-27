#!/bin/bash

# MiniCDE Build Script
# This script builds and deploys the MiniCDE application with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="minicde"
VERSION="1.0.0"
ENVIRONMENT=${1:-development}

echo -e "${BLUE}🚀 MiniCDE Build Script${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are available"

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker daemon is not running. Please start Docker first."
    exit 1
fi

print_status "Docker daemon is running"

# Clean up previous builds
echo -e "${BLUE}🧹 Cleaning up previous builds...${NC}"
docker-compose down --remove-orphans 2>/dev/null || true
docker system prune -f 2>/dev/null || true
print_status "Cleanup completed"

# Build frontend
echo -e "${BLUE}🏗️  Building frontend...${NC}"
cd frontend
if [ -d "build" ]; then
    rm -rf build
fi
npm run build
print_status "Frontend build completed"

# Build backend
echo -e "${BLUE}🏗️  Building backend...${NC}"
cd ../backend
npm run build
print_status "Backend build completed"

# Return to root directory
cd ..

# Build Docker images
echo -e "${BLUE}🐳 Building Docker images...${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    print_warning "Building for PRODUCTION environment"
    docker-compose --profile production build --no-cache
else
    print_warning "Building for DEVELOPMENT environment"
    docker-compose build --no-cache
fi

print_status "Docker images built successfully"

# Create SSL certificates for production (self-signed for development)
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${BLUE}🔐 Setting up SSL certificates...${NC}"
    if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
        print_warning "SSL certificates not found. Creating self-signed certificates..."
        mkdir -p nginx/ssl
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=VN/ST=Hanoi/L=Hanoi/O=MiniCDE/OU=IT/CN=localhost"
        print_status "Self-signed SSL certificates created"
    else
        print_status "SSL certificates found"
    fi
fi

# Start services
echo -e "${BLUE}🚀 Starting services...${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose --profile production up -d
else
    docker-compose up -d
fi

print_status "Services started successfully"

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check service health
echo -e "${BLUE}🏥 Checking service health...${NC}"

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U minicde_user -d minicde >/dev/null 2>&1; then
    print_status "PostgreSQL is healthy"
else
    print_error "PostgreSQL is not healthy"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
    print_status "Redis is healthy"
else
    print_error "Redis is not healthy"
fi

# Check Backend
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    print_status "Backend API is healthy"
else
    print_error "Backend API is not healthy"
fi

# Check Frontend
if curl -f http://localhost:8080/health >/dev/null 2>&1; then
    print_status "Frontend is healthy"
else
    print_error "Frontend is not healthy"
fi

# Run database migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
docker-compose exec -T backend npx prisma migrate deploy
print_status "Database migrations completed"

# Display service information
echo -e "${BLUE}📊 Service Information:${NC}"
echo -e "${GREEN}Frontend:${NC} http://localhost:8080"
echo -e "${GREEN}Backend API:${NC} http://localhost:3001"
echo -e "${GREEN}PostgreSQL:${NC} localhost:5432"
echo -e "${GREEN}Redis:${NC} localhost:6379"

if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${GREEN}Production Proxy:${NC} https://localhost"
fi

echo ""
echo -e "${GREEN}🎉 MiniCDE has been successfully built and deployed!${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  ${BLUE}View logs:${NC} docker-compose logs -f"
echo -e "  ${BLUE}Stop services:${NC} docker-compose down"
echo -e "  ${BLUE}Restart services:${NC} docker-compose restart"
echo -e "  ${BLUE}Update services:${NC} ./build.sh ${ENVIRONMENT}"
echo ""

# Optional: Run tests
read -p "Do you want to run the test suite? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🧪 Running test suite...${NC}"
    node test-project-card.js
    print_status "Test suite completed"
fi

echo -e "${GREEN}✨ Build process completed successfully!${NC}"