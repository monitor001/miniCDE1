# MiniCDE Environment Setup & CORS Fix Summary

## 🚨 Vấn đề đã được sửa

### 1. Lỗi CORS (Cross-Origin Resource Sharing)
- **Nguyên nhân**: Frontend từ `http://qlda.hoanglong24.com` không thể kết nối với backend Heroku `https://minicde-production-589be4b0d52b.herokuapp.com`
- **Giải pháp**: 
  - Cập nhật CORS configuration trong backend
  - Thêm `CORS_ORIGIN` environment variable
  - Cải thiện error handling cho CORS

### 2. Lỗi Service Unavailable (503)
- **Nguyên nhân**: Heroku app có thể bị quá tải hoặc cấu hình không đúng
- **Giải pháp**:
  - Cập nhật environment variables
  - Tối ưu hóa rate limiting
  - Cải thiện error handling

## 🌍 Thiết lập 3 môi trường linh hoạt

### 1. Development Environment (`dev`)
```bash
# Chạy: switch-environment.bat dev
```
- **Frontend**: http://localhost:3000 (React dev server)
- **Backend**: http://localhost:3001 (Express dev server)
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Features**:
  - Hot reload enabled
  - Debug mode enabled
  - Source maps enabled
  - Volume mounting for live code changes
  - Development database (`minicde_dev`)

### 2. Local Production Environment (`local-prod`)
```bash
# Chạy: switch-environment.bat local-prod
```
- **Frontend**: http://localhost:8080 (Nginx served)
- **Backend**: http://localhost:3001 (Express production)
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Features**:
  - Production builds
  - Optimized performance
  - No nginx proxy
  - Direct container access

### 3. Production Environment (`prod`)
```bash
# Chạy: switch-environment.bat prod
```
- **Frontend**: http://localhost:8080 (Nginx reverse proxy)
- **Backend**: http://localhost:3001 (Express production)
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Features**:
  - Nginx reverse proxy
  - SSL termination ready
  - Production security settings
  - Load balancing ready

## 🔧 Cấu hình môi trường

### Frontend Configuration (`frontend/src/config/environment.ts`)
```typescript
// Tự động phát hiện môi trường dựa trên hostname
const getEnvironment = (): string => {
  const hostname = window.location.hostname;
  
  if (hostname.includes('herokuapp.com')) {
    return 'production';
  }
  
  if (hostname === 'localhost' && protocol === 'http:') {
    return 'local-production';
  }
  
  return 'development';
};
```

### Backend Configuration (`backend/src/config/environment.ts`)
```typescript
// Cấu hình CORS linh hoạt
const getCorsOrigins = () => {
  const env = process.env.NODE_ENV;
  const corsOrigin = process.env.CORS_ORIGIN;
  
  if (corsOrigin) {
    return corsOrigin.split(',').map(origin => origin.trim());
  }
  
  // Tự động chọn origins dựa trên môi trường
  if (env === 'production') {
    return [
      'https://minicde-production-589be4b0d52b.herokuapp.com',
      'https://qlda.hoanglong24.com',
      'https://*.herokuapp.com'
    ];
  }
  
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080'
  ];
};
```

## 🐳 Docker Configuration

### Development (`docker-compose.dev.yml`)
- Volume mounting cho hot reload
- Development database
- Debug mode enabled
- Source maps enabled

### Production (`docker-compose.yml`)
- Optimized builds
- Production security
- Nginx reverse proxy
- Health checks

## 🔄 Scripts tự động

### 1. Chuyển đổi môi trường
```bash
# Development
switch-environment.bat dev

# Local Production
switch-environment.bat local-prod

# Production
switch-environment.bat prod
```

### 2. Cập nhật Heroku
```bash
# Cập nhật cấu hình Heroku
update-heroku-config.bat

# Build và deploy
start-docker.bat
```

### 3. Build tự động
```bash
# Windows Batch
start-docker.bat

# PowerShell
.\start-docker.ps1
```

## 🌐 URLs cho từng môi trường

### Development
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432
- Redis: localhost:6379

### Local Production
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- Database: localhost:5432
- Redis: localhost:6379

### Production (Heroku)
- Frontend: https://qlda.hoanglong24.com
- Backend API: https://minicde-production-589be4b0d52b.herokuapp.com/api
- Database: Heroku PostgreSQL
- Redis: Heroku Redis

## 🔧 Cấu hình Heroku

### Environment Variables
```bash
# CORS Configuration
CORS_ORIGIN=https://qlda.hoanglong24.com,https://minicde-production-589be4b0d52b.herokuapp.com

# API Configuration
REACT_APP_API_URL=https://minicde-production-589be4b0d52b.herokuapp.com/api
REACT_APP_SOCKET_URL=https://minicde-production-589be4b0d52b.herokuapp.com

# Security
JWT_SECRET=minicde_jwt_secret_2024_secure_production_key
TRUST_PROXY=1

# Performance
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=5
```

## 📊 Monitoring và Debugging

### Development
```bash
# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Debug frontend
# Open browser dev tools at http://localhost:3000

# Debug backend
# Check logs at http://localhost:3001/health
```

### Production
```bash
# View logs
docker-compose logs -f

# Heroku logs
heroku logs --tail -a minicde-production

# Health check
curl http://localhost:8080/health
```

## ✅ Kết quả

### Đã sửa
- ✅ Lỗi CORS giữa frontend và backend
- ✅ Lỗi Service Unavailable (503)
- ✅ Cấu hình môi trường linh hoạt
- ✅ Tự động phát hiện môi trường
- ✅ Scripts chuyển đổi môi trường

### Tính năng mới
- ✅ 3 môi trường riêng biệt
- ✅ Hot reload cho development
- ✅ Production optimization
- ✅ CORS configuration linh hoạt
- ✅ Error handling cải thiện
- ✅ Health checks
- ✅ Monitoring tools

## 🎯 Hướng dẫn sử dụng

### 1. Development
```bash
# Khởi động môi trường development
switch-environment.bat dev

# Truy cập ứng dụng
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### 2. Production (Local)
```bash
# Khởi động môi trường production local
switch-environment.bat local-prod

# Truy cập ứng dụng
# Frontend: http://localhost:8080
# Backend: http://localhost:3001
```

### 3. Heroku Production
```bash
# Cập nhật cấu hình Heroku
update-heroku-config.bat

# Deploy lên Heroku
git push heroku main

# Truy cập ứng dụng
# https://qlda.hoanglong24.com
```

## 🔄 Workflow đề xuất

1. **Development**: Sử dụng `dev` environment cho coding và testing
2. **Local Testing**: Sử dụng `local-prod` environment để test production build
3. **Deployment**: Sử dụng `prod` environment hoặc Heroku cho production

---
*Generated on: 30/07/2025*
*Version: 2.0.0* 