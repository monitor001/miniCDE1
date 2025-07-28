# Tài khoản Admin và Cấu hình Hệ thống

## 🔐 Tài khoản Admin duy nhất

### Tài khoản Admin chính
- **Email**: `nguyenthanhvc@gmail.com`
- **Password**: `Ab5463698664#`
- **Role**: `ADMIN`
- **Mô tả**: Tài khoản admin duy nhất cho hệ thống

## 🚫 Cấu hình Bảo mật

### Đăng ký tài khoản bị vô hiệu hóa
- ✅ Route `/api/auth/register` đã bị comment out
- ✅ Chỉ admin mới có thể tạo tài khoản mới
- ✅ Sử dụng route `/api/users` (POST) để admin tạo tài khoản

### Quyền truy cập
- **Admin**: Có thể tạo, sửa, xóa tài khoản
- **User thường**: Chỉ có thể xem và sửa thông tin cá nhân
- **Khách**: Chỉ có thể đăng nhập

## 📋 Hướng dẫn sử dụng

### 1. Đăng nhập với tài khoản admin
```bash
# Đăng nhập với tài khoản admin duy nhất
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nguyenthanhvc@gmail.com",
    "password": "Ab5463698664#"
  }'
```

### 2. Tạo tài khoản mới (chỉ admin)
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepassword123",
    "name": "New User",
    "role": "USER",
    "organization": "Example Corp",
    "department": "Engineering"
  }'
```

### 3. Xem danh sách tài khoản (chỉ admin)
```bash
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🔧 Cấu hình Database

### Seed data tự động
Khi chạy `npm run db:seed`, hệ thống sẽ tự động tạo:
- 1 tài khoản admin duy nhất
- 1 dự án mẫu
- 3 sự kiện lịch mẫu

### Chạy seed data
```bash
# Development
npm run db:seed

# Production (Heroku)
heroku run npm run db:seed
```

## 🛡️ Bảo mật

### Mật khẩu
- Tất cả mật khẩu được hash bằng bcrypt
- Salt rounds: 10
- Không lưu mật khẩu plain text

### JWT Token
- Expires: 7 days (có thể cấu hình)
- Secret: Được set qua environment variable
- Role-based access control

### 2FA (Two-Factor Authentication)
- Hỗ trợ TOTP (Time-based One-Time Password)
- Sử dụng Google Authenticator hoặc tương tự
- Chỉ admin mới có thể enable/disable 2FA

## 📊 Monitoring

### Log Activity
Tất cả hoạt động được log:
- Đăng nhập/đăng xuất
- Tạo/sửa/xóa tài khoản
- Thay đổi thông tin cá nhân

### Health Check
```bash
# Kiểm tra hệ thống
curl http://localhost:3001/health

# Kiểm tra database
curl http://localhost:3001/health/db
```

## 🔄 Quản lý tài khoản

### Các role có sẵn
- `ADMIN`: Quản trị viên hệ thống
- `PROJECT_MANAGER`: Quản lý dự án
- `BIM_MANAGER`: Quản lý BIM
- `CONTRIBUTOR`: Người đóng góp
- `VIEWER`: Người xem
- `USER`: Người dùng cơ bản

### Quyền hạn
- **ADMIN**: Toàn quyền
- **PROJECT_MANAGER**: Quản lý dự án và thành viên
- **BIM_MANAGER**: Quản lý tài liệu và mô hình
- **CONTRIBUTOR**: Tạo và sửa nội dung
- **VIEWER**: Chỉ xem
- **USER**: Quyền cơ bản

## 🚨 Lưu ý quan trọng

### Production
1. **Thay đổi mật khẩu admin** sau khi deploy
2. **Bật 2FA** cho tài khoản admin
3. **Sử dụng strong JWT secret**
4. **Monitor log activity**

### Development
1. Sử dụng tài khoản `nguyenthanhvc@gmail.com` cho testing và production
2. Không commit mật khẩu thực vào code
3. Sử dụng environment variables

### Backup
1. Backup database thường xuyên
2. Export user data định kỳ
3. Lưu trữ an toàn thông tin admin

## 📝 Environment Variables

### Required cho Admin
```bash
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

### Optional
```bash
JWT_EXPIRES_IN=7d
ENABLE_2FA=true
ADMIN_EMAIL=admin@yourcompany.com
```

## 🎯 Next Steps

1. **Deploy lên Heroku** với cấu hình đã sẵn
2. **Thay đổi mật khẩu admin** sau khi deploy
3. **Bật 2FA** cho tài khoản admin
4. **Tạo tài khoản user** thông qua admin panel
5. **Monitor activity logs** để đảm bảo an toàn 