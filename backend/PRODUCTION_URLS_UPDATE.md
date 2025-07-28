# Production URLs Update Guide

## 🔍 **Phát hiện các vấn đề:**

### ❌ **Các file cần cập nhật:**

#### 1. **Frontend Configuration**
- `frontend/src/axiosConfig.ts` - API URL vẫn dùng localhost
- `frontend/package.json` - Scripts có thể cần cập nhật

#### 2. **Backend Configuration**
- `backend/src/index.ts` - CORS origins có localhost
- `backend/env.example` - Database URLs dùng localhost
- `backend/test-*.js` files - Test URLs dùng localhost

#### 3. **Documentation Files**
- Nhiều file .md có localhost URLs
- Docker configuration có localhost

## ✅ **Cập nhật cần thiết:**

### 1. **Frontend API Configuration**
```typescript
// frontend/src/axiosConfig.ts
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://YOUR_ACTUAL_HEROKU_APP.herokuapp.com/api'  // ← Cập nhật
    : 'http://localhost:3001/api'
  );
```

### 2. **Backend CORS Configuration**
```typescript
// backend/src/index.ts
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://YOUR_ACTUAL_HEROKU_APP.herokuapp.com',  // ← Cập nhật
        'https://YOUR_FRONTEND_DOMAIN.com',              // ← Cập nhật
        'https://*.herokuapp.com',
        'https://*.vercel.app',
        'https://*.netlify.app'
      ]
    : [
        // Development origins - giữ nguyên
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        // ...
      ]
};
```

### 3. **Environment Variables**
```bash
# backend/.env (production)
DATABASE_URL="postgresql://user:pass@host:port/db"  # ← Heroku Postgres URL
REDIS_URL="redis://host:port"                       # ← Heroku Redis URL
```

### 4. **Test Configuration**
```javascript
// backend/test-admin-login.js
const TEST_CONFIG = {
  dev: {
    baseURL: 'http://localhost:3001/api',
    adminEmail: 'nguyenthanhvc@gmail.com',
    adminPassword: 'Ab5463698664#'
  },
  prod: {
    baseURL: 'https://YOUR_ACTUAL_HEROKU_APP.herokuapp.com/api',  // ← Cập nhật
    adminEmail: 'nguyenthanhvc@gmail.com',
    adminPassword: 'Ab5463698664#'
  }
};
```

## 🚀 **Các bước cập nhật:**

### **Bước 1: Xác định Heroku App Name**
```bash
# Tạo Heroku app (nếu chưa có)
heroku create your-app-name

# Hoặc kiểm tra app hiện tại
heroku apps
```

### **Bước 2: Cập nhật Frontend**
```bash
# Cập nhật axiosConfig.ts
# Thay YOUR_ACTUAL_HEROKU_APP bằng tên app thực tế
```

### **Bước 3: Cập nhật Backend**
```bash
# Cập nhật CORS origins
# Cập nhật test configurations
```

### **Bước 4: Cập nhật Environment Variables**
```bash
# Heroku environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secure_secret
heroku config:set REACT_APP_API_URL=https://your-app.herokuapp.com/api
```

### **Bước 5: Test Production URLs**
```bash
# Test admin login
npm run test:admin

# Test SSL/CORS
npm run test:ssl
```

## 📋 **Checklist cập nhật:**

### ✅ **Frontend**
- [ ] `frontend/src/axiosConfig.ts` - API URL
- [ ] `frontend/package.json` - Build scripts
- [ ] Environment variables

### ✅ **Backend**
- [ ] `backend/src/index.ts` - CORS origins
- [ ] `backend/test-*.js` files - Test URLs
- [ ] Environment variables

### ✅ **Documentation**
- [ ] Update README files
- [ ] Update deployment guides
- [ ] Update test documentation

### ✅ **Deployment**
- [ ] Heroku app name
- [ ] Environment variables
- [ ] Database URLs
- [ ] Redis URLs

## 🔧 **Scripts để tự động cập nhật:**

### **1. Update Frontend API URL**
```bash
# Thay thế placeholder URLs
sed -i 's/your-app-name/YOUR_ACTUAL_APP_NAME/g' frontend/src/axiosConfig.ts
```

### **2. Update Backend CORS**
```bash
# Thay thế placeholder URLs
sed -i 's/your-app-name/YOUR_ACTUAL_APP_NAME/g' backend/src/index.ts
```

### **3. Update Test Configs**
```bash
# Thay thế placeholder URLs trong test files
find backend -name "test-*.js" -exec sed -i 's/your-app-name/YOUR_ACTUAL_APP_NAME/g' {} \;
```

## 🎯 **Kết quả mong đợi:**

### ✅ **Development**
- Localhost URLs vẫn hoạt động cho development
- Test scripts chạy được trên local

### ✅ **Production**
- Tất cả URLs trỏ đến Heroku app thực tế
- CORS cho phép frontend domain thực tế
- Database và Redis kết nối đến Heroku services

### ✅ **Testing**
- Test scripts có thể test cả dev và prod
- Automated tests chạy được trên production

---

**Status**: ⚠️ **NEEDS UPDATES**
**Next Step**: Cập nhật tất cả placeholder URLs thành URLs thực tế 