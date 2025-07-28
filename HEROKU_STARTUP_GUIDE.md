# 🚀 Heroku App Startup Guide

## ⚠️ **Vấn đề PowerShell Execution Policy**

Bạn đang gặp lỗi PowerShell execution policy. Đây là cách khắc phục:

### 🔧 **Cách 1: Sử dụng PowerShell Script (Khuyến nghị)**

1. **Mở PowerShell với quyền Administrator**
2. **Chạy lệnh sau:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
3. **Chọn "Y" khi được hỏi**

### 🔧 **Cách 2: Sử dụng file script đã tạo**

1. **Chạy file `fix-powershell.ps1`** (double-click)
2. **Hoặc chạy trong PowerShell:**
```powershell
.\fix-powershell.ps1
```

## 🚀 **Start Heroku App**

### **Cách 1: Sử dụng Batch File (Dễ nhất)**
```bash
# Double-click file start-app.bat
# Hoặc chạy trong Command Prompt:
start-app.bat
```

### **Cách 2: Chạy từng lệnh thủ công**

#### **Step 1: Start web dyno**
```bash
heroku ps:scale web=1 --app minicde-production
```

#### **Step 2: Run database migrations**
```bash
heroku run "cd backend && npm run db:migrate" --app minicde-production
```

#### **Step 3: Seed database**
```bash
heroku run "cd backend && npm run db:seed" --app minicde-production
```

#### **Step 4: Test health endpoint**
```bash
curl https://minicde-production-589be4b0d52b.herokuapp.com/health
```

#### **Step 5: Test admin login**
```bash
curl -X POST https://minicde-production-589be4b0d52b.herokuapp.com/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"nguyenthanhvc@gmail.com\",\"password\":\"Ab5463698664#\"}"
```

## 🔗 **App Information**

### **URLs:**
- **App**: https://minicde-production-589be4b0d52b.herokuapp.com
- **API**: https://minicde-production-589be4b0d52b.herokuapp.com/api
- **Dashboard**: https://dashboard.heroku.com/apps/minicde-production

### **Admin Account:**
- **Email**: nguyenthanhvc@gmail.com
- **Password**: Ab5463698664#

## 📝 **Troubleshooting**

### **Nếu vẫn gặp lỗi PowerShell:**
1. Mở PowerShell với quyền Administrator
2. Chạy: `Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser`
3. Chọn "Y"

### **Nếu Heroku CLI không hoạt động:**
1. Cài đặt lại Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login: `heroku login`

### **Nếu app không start:**
1. Kiểm tra logs: `heroku logs --app minicde-production --tail`
2. Restart app: `heroku restart --app minicde-production`

## 🎯 **Expected Results**

Sau khi chạy thành công, bạn sẽ thấy:
- ✅ Web dyno running
- ✅ Database migrations completed
- ✅ Database seeded
- ✅ Health endpoint responding
- ✅ Admin login working

## 📞 **Support**

Nếu gặp vấn đề, hãy:
1. Kiểm tra logs: `heroku logs --app minicde-production`
2. Kiểm tra app status: `heroku ps --app minicde-production`
3. Kiểm tra config: `heroku config --app minicde-production` 