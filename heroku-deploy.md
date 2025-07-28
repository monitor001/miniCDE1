# Hướng dẫn Deploy MiniCDE lên Heroku

## 1. Chuẩn bị

### 1.1. Cài đặt Heroku CLI
```bash
# Windows
# Tải từ: https://devcenter.heroku.com/articles/heroku-cli

# macOS
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

### 1.2. Đăng nhập Heroku
```bash
heroku login
```

## 2. Tạo ứng dụng Heroku

### 2.1. Tạo app mới
```bash
heroku create your-app-name
```

### 2.2. Thêm addons
```bash
# PostgreSQL database
heroku addons:create heroku-postgresql:mini

# Redis (optional)
heroku addons:create heroku-redis:mini
```

## 3. Cấu hình Environment Variables

### 3.1. Cấu hình cơ bản
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secret-jwt-key-change-in-production
heroku config:set MAX_FILE_SIZE=52428800
heroku config:set ALLOWED_FILE_TYPES="pdf,dwg,rvt,ifc,docx,xlsx,jpg,png"
```

### 3.2. Cấu hình Database
```bash
# Lấy DATABASE_URL từ Heroku
heroku config:get DATABASE_URL

# Cấu hình connection pooling
heroku config:set DATABASE_POOL_MIN=2
heroku config:set DATABASE_POOL_MAX=10
heroku config:set DATABASE_POOL_IDLE_TIMEOUT=30000
heroku config:set DATABASE_POOL_ACQUIRE_TIMEOUT=60000
```

### 3.3. Cấu hình Redis (nếu có)
```bash
# Lấy REDIS_URL từ Heroku
heroku config:get REDIS_URL
heroku config:set REDIS_TTL=3600
```

### 3.4. Cấu hình Email (optional)
```bash
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASS=your-app-password
heroku config:set EMAIL_FROM="CDE BIM <noreply@your-app.com>"
```

### 3.5. Cấu hình Rate Limiting
```bash
heroku config:set RATE_LIMIT_WINDOW_MS=900000
heroku config:set RATE_LIMIT_MAX_REQUESTS=1000
heroku config:set AUTH_RATE_LIMIT_MAX=5
```

### 3.6. Cấu hình Timeouts
```bash
heroku config:set REQUEST_TIMEOUT=30000
heroku config:set RESPONSE_TIMEOUT=30000
```

### 3.7. Cấu hình Features
```bash
heroku config:set ENABLE_PROJECT_STATS=true
heroku config:set ENABLE_PROJECT_EXPORT=true
heroku config:set ENABLE_PROJECT_SHARING=true
```

## 4. Deploy

### 4.1. Deploy lần đầu
```bash
# Thêm remote Heroku
heroku git:remote -a your-app-name

# Push code
git push heroku main

# Chạy migrations
heroku run npm run db:migrate

# Seed data (optional)
heroku run npm run db:seed
```

### 4.2. Kiểm tra logs
```bash
heroku logs --tail
```

### 4.3. Kiểm tra health check
```bash
curl https://your-actual-heroku-app-name.herokuapp.com/health
```

## 5. Cấu hình Frontend

### 5.1. Cập nhật API URL
Trong file `frontend/src/axiosConfig.ts`, thay đổi:
```typescript
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://your-actual-heroku-app-name.herokuapp.com/api'
    : 'http://localhost:3001/api'
  );
```

### 5.2. Build và deploy frontend
```bash
cd frontend
npm run build
# Upload build folder lên CDN hoặc hosting service
```

## 6. Monitoring và Maintenance

### 6.1. Kiểm tra performance
```bash
heroku ps
heroku logs --tail
```

### 6.2. Scale ứng dụng (nếu cần)
```bash
heroku ps:scale web=1
```

### 6.3. Backup database
```bash
heroku pg:backups:capture
heroku pg:backups:download
```

## 7. Troubleshooting

### 7.1. Lỗi thường gặp

#### Database connection
```bash
# Kiểm tra database
heroku pg:info
heroku pg:psql
```

#### Build errors
```bash
# Xem build logs
heroku builds:cancel
heroku builds:cache:purge
```

#### Memory issues
```bash
# Kiểm tra memory usage
heroku logs --tail | grep "Memory"
```

### 7.2. Debug commands
```bash
# Chạy app locally với Heroku config
heroku local web

# Kiểm tra environment variables
heroku config

# Restart app
heroku restart
```

## 8. Security Checklist

- [ ] JWT_SECRET được set và đủ mạnh
- [ ] DATABASE_URL được bảo vệ
- [ ] CORS được cấu hình đúng
- [ ] Rate limiting được enable
- [ ] HTTPS được force
- [ ] Security headers được set
- [ ] File upload size được limit
- [ ] Allowed file types được restrict

## 9. Performance Optimization

### 9.1. Database
- Sử dụng connection pooling
- Tối ưu queries
- Sử dụng indexes

### 9.2. Caching
- Redis caching cho API responses
- Static file caching
- CDN cho frontend assets

### 9.3. Monitoring
- Heroku metrics
- Application logs
- Database performance

## 10. Backup và Recovery

### 10.1. Database backup
```bash
# Tạo backup
heroku pg:backups:capture

# Download backup
heroku pg:backups:download

# Restore backup
heroku pg:backups:restore b001 DATABASE_URL
```

### 10.2. Environment variables backup
```bash
# Export config
heroku config --shell > config.txt

# Import config
heroku config:set $(cat config.txt)
``` 