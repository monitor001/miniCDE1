# 🔧 Troubleshooting Task Management

## Vấn đề: Không lấy được dự án và người dùng trong hộp thoại thêm task

### ✅ Đã sửa:

1. **Backend API Structure**: 
   - Projects API trả về `{ projects, pagination }` thay vì array trực tiếp
   - Users API trả về `{ users, pagination }` thay vì array trực tiếp
   - Frontend đã được cập nhật để xử lý đúng format

2. **Authentication Issues**:
   - Thêm endpoint `/api/users/assignable` cho project members
   - Thêm endpoint test `/api/test/users` để kiểm tra API
   - Cải thiện error handling trong frontend

3. **Frontend Logic**:
   - Cập nhật `fetchProjects()` và `fetchUsers()` để xử lý đúng response format
   - Thêm debug logging để theo dõi authentication status
   - Cải thiện fallback logic khi không phải admin

### 🔍 Cách kiểm tra:

1. **Kiểm tra Authentication**:
   ```bash
   # Test login
   curl -X POST "http://localhost:3001/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@minicde.com","password":"admin123"}'
   ```

2. **Kiểm tra API với token**:
   ```bash
   # Test projects API
   curl -X GET "http://localhost:3001/api/projects" \
     -H "Authorization: Bearer YOUR_TOKEN"
   
   # Test users API  
   curl -X GET "http://localhost:3001/api/users" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Kiểm tra Database**:
   ```bash
   # Kiểm tra users
   docker-compose exec postgres psql -U minicde_user -d minicde_bim -c "SELECT COUNT(*) FROM \"User\";"
   
   # Kiểm tra projects
   docker-compose exec postgres psql -U minicde_user -d minicde_bim -c "SELECT COUNT(*) FROM \"Project\";"
   
   # Kiểm tra project members
   docker-compose exec postgres psql -U minicde_user -d minicde_bim -c "SELECT COUNT(*) FROM \"ProjectMember\";"
   ```

### 🚀 Cách sử dụng:

1. **Đăng nhập vào hệ thống**:
   - Truy cập `http://localhost:3000`
   - Đăng nhập với `admin@minicde.com` / `admin123`

2. **Kiểm tra Task Management**:
   - Vào trang Tasks
   - Mở Developer Console (F12) để xem debug logs
   - Thử thêm task mới

3. **Debug Logs**:
   - Frontend sẽ hiển thị logs với emoji:
     - 🔍 Debug - Token exists
     - ✅ Users fetched successfully
     - ❌ Lỗi fetchUsers
     - 🔄 Trying assignable users

### 📋 Checklist:

- [x] Backend API endpoints hoạt động
- [x] Database có dữ liệu users và projects
- [x] Frontend xử lý đúng response format
- [x] Authentication token được lưu đúng cách
- [x] Debug logging đã được thêm
- [x] Fallback logic cho non-admin users

### 🎯 Kết quả mong đợi:

1. **Admin user**: Có thể thấy tất cả users và projects
2. **Project member**: Chỉ thấy users trong cùng project
3. **Task creation**: Có thể chọn project và assignee
4. **Debug logs**: Hiển thị rõ ràng trong console

### 🔧 Nếu vẫn có vấn đề:

1. **Kiểm tra logs**:
   ```bash
   docker-compose logs backend --tail=50
   docker-compose logs frontend --tail=50
   ```

2. **Restart services**:
   ```bash
   docker-compose restart backend frontend
   ```

3. **Clear browser cache** và thử lại

4. **Kiểm tra token** trong browser localStorage

---

**Status**: ✅ Đã sửa xong - Hệ thống task management đã hoạt động đầy đủ! 