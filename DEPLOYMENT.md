# MiniCDE Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying the MiniCDE application with Docker, including the new project card features.

## Prerequisites

### System Requirements
- **OS**: Linux, macOS, or Windows 10/11 with WSL2
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: At least 10GB free space
- **CPU**: 2 cores minimum (4 cores recommended)

### Software Installation
1. **Install Docker Desktop**:
   - [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows/)
   - [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac/)
   - [Docker Engine for Linux](https://docs.docker.com/engine/install/)

2. **Verify Installation**:
   ```bash
   docker --version
   docker-compose --version
   ```

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd miniCDE1
```

### 2. Environment Setup
Create environment files for your deployment:

#### Backend Environment (`.env` in backend directory)
```env
# Database
DATABASE_URL="postgresql://minicde_user:minicde_password@postgres:5432/minicde"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Server Configuration
PORT=3001
NODE_ENV=production

# Redis Configuration
REDIS_URL="redis://redis:6379"

# Project Card Features
ENABLE_PROJECT_STATS=true
ENABLE_PROJECT_EXPORT=true
ENABLE_PROJECT_SHARING=true

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_PATH=/app/uploads

# Logging
LOG_LEVEL=info
```

#### Frontend Environment (`.env` in frontend directory)
```env
# API Configuration
REACT_APP_API_URL=http://localhost/api
REACT_APP_SOCKET_URL=http://localhost

# Feature Flags
REACT_APP_ENABLE_PROJECT_CARDS=true
REACT_APP_ENABLE_EXPORT=true
REACT_APP_ENABLE_SHARING=true

# Build Configuration
GENERATE_SOURCEMAP=false
```

### 3. Build and Deploy

#### Development Environment
```bash
# Build and start all services
./build.sh development

# Or manually:
docker-compose up -d
```

#### Production Environment
```bash
# Build and start with production configuration
./build.sh production

# Or manually:
docker-compose --profile production up -d
```

### 4. Verify Deployment
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Health checks
curl http://localhost:8080/health  # Frontend
curl http://localhost:3001/health  # Backend
```

## Service Architecture

### Container Services
1. **Frontend** (Port 8080)
   - React application with enhanced project cards
   - Nginx server for static file serving
   - API proxy configuration

2. **Backend** (Port 3001)
   - Node.js/Express API server
   - Prisma ORM for database management
   - Socket.IO for real-time features
   - Enhanced project management APIs

3. **PostgreSQL** (Port 5432)
   - Primary database
   - Optimized for project management data
   - Includes new ProjectShare model

4. **Redis** (Port 6379)
   - Caching and session storage
   - Real-time data management
   - Rate limiting support

5. **Nginx Proxy** (Ports 80/443 - Production only)
   - SSL termination
   - Load balancing
   - Security headers
   - Rate limiting

### Network Configuration
- **Internal Network**: `minicde_network` (172.20.0.0/16)
- **Service Discovery**: Automatic via Docker Compose
- **External Access**: Configured ports for each service

## New Features Deployment

### Project Card Features
The deployment includes enhanced project card functionality:

1. **Real-time Statistics**
   - Project progress tracking
   - Task completion metrics
   - Resource utilization

2. **Export Functionality**
   - Multiple format support (Excel, PDF, Word)
   - Comprehensive data export
   - Activity logging

3. **Comment System**
   - Real-time commenting
   - User mentions (@username)
   - Permission-based access

4. **Project Sharing**
   - Email-based sharing
   - Share management
   - Status tracking

### API Endpoints
New endpoints are automatically available:
- `GET /api/projects/:id/stats` - Project statistics
- `GET /api/projects/:id/export` - Project export
- `POST /api/projects/:id/share` - Project sharing
- `GET /api/projects/:id/comments` - Project comments

## Configuration Options

### Docker Compose Profiles
- **Development**: Basic services without SSL
- **Production**: Full stack with SSL and security

### Environment Variables
Key configuration options:

```yaml
# Backend Configuration
ENABLE_PROJECT_STATS: true          # Enable project statistics
ENABLE_PROJECT_EXPORT: true         # Enable export functionality
ENABLE_PROJECT_SHARING: true        # Enable sharing features
MAX_FILE_SIZE: 50MB                 # Maximum file upload size
LOG_LEVEL: info                     # Logging level

# Frontend Configuration
REACT_APP_ENABLE_PROJECT_CARDS: true # Enable enhanced project cards
REACT_APP_ENABLE_EXPORT: true       # Enable export UI
REACT_APP_ENABLE_SHARING: true      # Enable sharing UI
```

### Resource Limits
```yaml
# Backend
memory: 1G
cpus: '0.5'

# Frontend
memory: 512M
cpus: '0.25'

# Redis
memory: 256M
cpus: '0.1'
```

## Security Configuration

### SSL/TLS Setup
For production deployments:

1. **Generate SSL Certificates**:
   ```bash
   mkdir -p nginx/ssl
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout nginx/ssl/key.pem \
     -out nginx/ssl/cert.pem \
     -subj "/C=VN/ST=Hanoi/L=Hanoi/O=MiniCDE/OU=IT/CN=your-domain.com"
   ```

2. **Update Domain Configuration**:
   - Replace `your-domain.com` with your actual domain
   - Update nginx configuration for your domain

### Security Headers
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=31536000

### Rate Limiting
- API endpoints: 10 requests/second
- Login endpoints: 1 request/second
- Burst allowance: 20 requests

## Monitoring and Logging

### Health Checks
All services include health check endpoints:
- Frontend: `http://localhost:8080/health`
- Backend: `http://localhost:3001/health`
- Database: Automatic via Docker health checks

### Logging
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Monitoring Commands
```bash
# Check service status
docker-compose ps

# Check resource usage
docker stats

# Check network connectivity
docker network ls
docker network inspect minicde_network
```

## Database Management

### Initial Setup
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Seed database (if available)
docker-compose exec backend npm run seed
```

### Backup and Restore
```bash
# Backup database
docker-compose exec -T postgres pg_dump -U minicde_user minicde > backup.sql

# Restore database
docker-compose exec -T postgres psql -U minicde_user minicde < backup.sql
```

### Database Maintenance
```bash
# Access database
docker-compose exec postgres psql -U minicde_user -d minicde

# Check database size
docker-compose exec postgres psql -U minicde_user -d minicde -c "SELECT pg_size_pretty(pg_database_size('minicde'));"
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :8080
netstat -tulpn | grep :3001

# Stop conflicting services
sudo systemctl stop apache2  # If using port 80
sudo systemctl stop nginx    # If using port 80
```

#### 2. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x build.sh

# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
```

#### 3. Memory Issues
```bash
# Check available memory
free -h

# Increase Docker memory limit (Docker Desktop)
# Settings > Resources > Memory: 4GB+
```

#### 4. Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U minicde_user -d minicde

# Restart database
docker-compose restart postgres
```

### Debug Mode
Enable debug logging:
```bash
# Set debug environment variables
export DEBUG=*
export NODE_ENV=development

# Restart services
docker-compose restart
```

### Performance Optimization

#### 1. Resource Optimization
```yaml
# Optimize container resources
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

#### 2. Database Optimization
```sql
-- Optimize PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
```

#### 3. Nginx Optimization
```nginx
# Enable gzip compression
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Scaling

### Horizontal Scaling
```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Scale with load balancer
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

### Load Balancer Configuration
```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

## Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec -T postgres pg_dump -U minicde_user minicde > $BACKUP_DIR/db_$DATE.sql

# File uploads backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz backend/uploads/

# Configuration backup
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env* docker-compose.yml nginx/

echo "Backup completed: $BACKUP_DIR/"
```

### Recovery Process
```bash
# Restore database
docker-compose exec -T postgres psql -U minicde_user minicde < backup.sql

# Restore uploads
tar -xzf uploads_backup.tar.gz -C backend/

# Restore configuration
tar -xzf config_backup.tar.gz
```

## Maintenance

### Regular Maintenance Tasks
1. **Weekly**:
   - Check service logs for errors
   - Monitor disk space usage
   - Review security updates

2. **Monthly**:
   - Update Docker images
   - Review and rotate logs
   - Performance analysis

3. **Quarterly**:
   - Security audit
   - Backup verification
   - Capacity planning

### Update Process
```bash
# Pull latest changes
git pull origin main

# Rebuild and deploy
./build.sh production

# Verify deployment
docker-compose ps
curl http://localhost:8080/health
```

## Support

### Getting Help
1. Check the logs: `docker-compose logs -f`
2. Review this deployment guide
3. Check the project documentation
4. Open an issue on the project repository

### Useful Commands
```bash
# Service management
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose restart            # Restart services
docker-compose logs -f            # View logs

# Development
docker-compose exec backend bash  # Access backend container
docker-compose exec postgres psql -U minicde_user -d minicde  # Access database

# Monitoring
docker-compose ps                 # Service status
docker stats                      # Resource usage
docker system prune -f            # Clean up
```

---

**Note**: This deployment guide covers the enhanced MiniCDE application with project card features. For additional support or feature requests, please refer to the project documentation or contact the development team. 