# 🔍 Localhost URLs Fix Report

## 📋 **Danh sách các file chứa localhost URLs:**

### **🚨 CRITICAL - Frontend Source Files (Cần fix ngay):**

#### **1. `frontend/src/axiosConfig.ts`**
- **Line 7**: `'http://localhost:3001/api'` - ✅ Đã được fix
- **Status**: ✅ Fixed

#### **2. `frontend/src/pages/Dashboard.tsx`**
- **Line 248**: `const socket = io('http://localhost:3001');` - ❌ Cần fix
- **Status**: ❌ Needs fix

#### **3. `frontend/src/pages/CalendarPage.tsx`**
- **Line 115**: `const socket = io('http://localhost:3001');` - ❌ Cần fix
- **Status**: ❌ Needs fix

#### **4. `frontend/src/pages/Tasks.tsx`**
- **Line 263**: `const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';` - ❌ Cần fix
- **Status**: ❌ Needs fix

#### **5. `frontend/src/pages/Project.tsx`**
- **Line 216**: `const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';` - ❌ Cần fix
- **Status**: ❌ Needs fix

#### **6. `frontend/src/pages/IssueDetail.tsx`**
- **Line 30**: `const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001');` - ❌ Cần fix
- **Status**: ❌ Needs fix

#### **7. `frontend/src/layouts/MainLayout.tsx`**
- **Line 52**: `const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3001', {` - ❌ Cần fix
- **Status**: ❌ Needs fix

### **🔧 Backend Files (Development only):**

#### **8. `backend/src/index.ts`**
- **Line 79**: `'http://localhost:3000',` - ✅ Development only
- **Line 85**: `'http://localhost:3001',` - ✅ Development only
- **Status**: ✅ Development only

### **📄 Documentation Files (Không cần fix):**

#### **9. `README.md`**
- **Line 117-118**: Localhost URLs for development
- **Status**: ✅ Documentation only

#### **10. `docker-compose.yml`**
- **Line 42**: `SOCKET_URL: http://localhost:3001` - ✅ Development only
- **Status**: ✅ Development only

#### **11. `build.sh`**
- **Line 151, 172**: Localhost URLs for local testing
- **Status**: ✅ Local testing only

### **🧪 Test Files (Development only):**

#### **12. `test_*.js` files**
- Multiple test files with localhost URLs
- **Status**: ✅ Development testing only

#### **13. `backend/test-*.js` files**
- Multiple backend test files
- **Status**: ✅ Development testing only

## 🛠️ **Action Plan:**

### **Priority 1: Fix Frontend Source Files**
1. ✅ `frontend/src/axiosConfig.ts` - Already fixed
2. ❌ `frontend/src/pages/Dashboard.tsx` - Need to fix
3. ❌ `frontend/src/pages/CalendarPage.tsx` - Need to fix
4. ❌ `frontend/src/pages/Tasks.tsx` - Need to fix
5. ❌ `frontend/src/pages/Project.tsx` - Need to fix
6. ❌ `frontend/src/pages/IssueDetail.tsx` - Need to fix
7. ❌ `frontend/src/layouts/MainLayout.tsx` - Need to fix

### **Priority 2: Rebuild and Deploy**
1. Rebuild frontend after fixes
2. Deploy to Heroku
3. Test functionality

### **Priority 3: Documentation Update**
1. Update documentation with production URLs
2. Keep development URLs for local development

## 🎯 **Expected Result:**
- All frontend source files will use environment variables
- Production will use Heroku URLs
- Development will still work with localhost
- No more localhost hardcoded in production build 