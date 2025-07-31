# MiniCDE Docker Local Development

Hướng dẫn sử dụng Docker để chạy MiniCDE locally cho development và testing.

## 🚀 Quick Start

### 1. Khởi động hệ thống
```bash
# Khởi động toàn bộ hệ thống
node docker-manager.js start

# Hoặc sử dụng docker-compose trực tiếp
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Kiểm tra trạng thái
```bash
# Xem trạng thái các container
node docker-manager.js status

# Xem logs
node docker-manager.js logs
```

### 3. Test hệ thống
```bash
# Chạy test toàn bộ hệ thống
node docker-manager.js test

# Hoặc chạy test script trực tiếp
node test-docker-local.js
```

## 📋 System Architecture

### Services
- **Frontend**: React app trên port 3001
- **Backend**: Node.js API trên port 3002
- **Database**: PostgreSQL trên port 5432
- **Cache**: Redis trên port 6379

### URLs
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3002
- **Health Check**: http://localhost:3002/health

## 🔑 Login Credentials

### Admin User
- **Email**: admin@minicde.com
- **Password**: admin123
- **Role**: ADMIN

### Default User
- **Email**: nguyenthanhvc@gmail.com
- **Password**: (đã được hash)
- **Role**: ADMIN

## 🛠️ Management Commands

### Docker Manager Script
```bash
# Khởi động hệ thống
node docker-manager.js start

# Dừng hệ thống
node docker-manager.js stop

# Khởi động lại
node docker-manager.js restart

# Build lại images
node docker-manager.js build

# Rebuild và restart toàn bộ
node docker-manager.js rebuild

# Xem trạng thái
node docker-manager.js status

# Xem logs
node docker-manager.js logs [service]

# Chạy test
node docker-manager.js test

# Dọn dẹp
node docker-manager.js clean

# Xem help
node docker-manager.js help
```

### Docker Compose Commands
```bash
# Khởi động
docker-compose -f docker-compose.dev.yml up -d

# Dừng
docker-compose -f docker-compose.dev.yml down

# Xem logs
docker-compose -f docker-compose.dev.yml logs

# Build
docker-compose -f docker-compose.dev.yml build

# Restart service
docker-compose -f docker-compose.dev.yml restart [service]
```

### Frontend Update Commands
```bash
# Cập nhật frontend build
node update-frontend.js

# Xem help
node update-frontend.js help
```

## 🗄️ Database Management

### Migration
```bash
# Chạy migration
docker-compose -f docker-compose.dev.yml exec backend npm run db:migrate

# Tạo migration mới
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name [migration_name]
```

### Seed Data
```bash
# Chạy seed data
docker-compose -f docker-compose.dev.yml exec backend npm run seed

# Tạo admin user
docker-compose -f docker-compose.dev.yml exec backend node create-admin.js
```

### Database Access
```bash
# Truy cập PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U minicde_user -d minicde_dev

# Xem danh sách bảng
\dt

# Xem dữ liệu users
SELECT id, email, name, role FROM "User";
```

## 🧪 Testing

### API Testing
```bash
# Test health check
curl http://localhost:3002/health

# Test login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@minicde.com","password":"admin123"}'

# Test protected API (với token)
curl -H "Authorization: Bearer [TOKEN]" \
  http://localhost:3002/api/users
```

### Frontend Testing
```bash
# Test frontend access
curl http://localhost:3001/

# Test frontend với browser
# Mở http://localhost:3001 trong trình duyệt
```

## 🔧 Troubleshooting

### CORS Issues
Nếu gặp lỗi CORS khi frontend cố gắng kết nối đến backend:
1. Kiểm tra cấu hình API URL trong `frontend/src/config/environment.ts`
2. Đảm bảo backend đang chạy trên port đúng (3002)
3. Rebuild frontend: `node update-frontend.js`
4. Restart containers: `node docker-manager.js restart`

### Port Conflicts
Nếu có lỗi port đã được sử dụng:
1. Kiểm tra port đang sử dụng: `netstat -ano | findstr :3001`
2. Thay đổi port trong `docker-compose.dev.yml`
3. Restart hệ thống

### Database Issues
```bash
# Reset database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d

# Chạy migration và seed
docker-compose -f docker-compose.dev.yml exec backend npm run db:migrate
docker-compose -f docker-compose.dev.yml exec backend npm run seed
```

### Build Issues
```bash
# Clean build
docker-compose -f docker-compose.dev.yml build --no-cache

# Rebuild toàn bộ
node docker-manager.js rebuild
```

### Logs Debugging
```bash
# Xem logs backend
node docker-manager.js logs backend

# Xem logs frontend
node docker-manager.js logs frontend

# Xem logs database
node docker-manager.js logs postgres
```

## 📁 File Structure

```
├── docker-compose.dev.yml      # Docker Compose cho development
├── docker-compose.yml          # Docker Compose cho production
├── docker-manager.js           # Script quản lý Docker
├── test-docker-local.js        # Script test hệ thống
├── backend/
│   ├── Dockerfile              # Backend Docker image
│   ├── prisma/                 # Database schema và migrations
│   └── src/                    # Backend source code
├── frontend/
│   ├── Dockerfile              # Frontend Docker image
│   ├── Dockerfile.dev          # Frontend development image
│   └── src/                    # Frontend source code
└── scripts/
    └── postgres-setup.sh       # Database setup script
```

## 🚀 Production Deployment

Để deploy lên production, sử dụng:
```bash
# Build production images
docker-compose build

# Deploy với nginx proxy
docker-compose --profile production up -d
```

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra logs: `node docker-manager.js logs`
2. Chạy test: `node docker-manager.js test`
3. Rebuild: `node docker-manager.js rebuild`
4. Clean và restart: `node docker-manager.js clean && node docker-manager.js start` 