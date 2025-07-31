# CDE BIM - Common Data Environment for BIM ISO 19650

CDE BIM là một hệ thống quản lý môi trường dữ liệu chung (Common Data Environment) tuân theo tiêu chuẩn ISO 19650 cho quy trình BIM (Building Information Modeling). Hệ thống cung cấp nền tảng để quản lý dự án, tài liệu, công việc và người dùng trong một môi trường dữ liệu tích hợp.

## Tính năng chính

- **Quản lý dự án**: Tạo, cập nhật và theo dõi tiến độ dự án
- **Quản lý tài liệu**: Tổ chức tài liệu theo container ISO 19650 (WIP, Shared, Published, Archive)
- **Quản lý công việc**: Phân công và theo dõi công việc với quy trình Kanban
- **Quản lý người dùng**: Phân quyền và quản lý thành viên dự án
- **Xác thực hai yếu tố**: Bảo mật tài khoản với 2FA
- **Đa ngôn ngữ**: Hỗ trợ tiếng Anh và tiếng Việt
- **Giao diện thích ứng**: Tương thích với máy tính, máy tính bảng và điện thoại
- **Chế độ tối/sáng**: Tùy chọn giao diện theo sở thích người dùng

## Kiến trúc hệ thống

### Frontend

- React + TypeScript
- Ant Design Pro
- Redux Toolkit
- React Query
- React Router v6
- i18n
- Socket.IO Client

### Backend

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Socket.IO
- Multer (xử lý file)

### Database

- PostgreSQL

## Cài đặt và chạy dự án

### Yêu cầu hệ thống

- Node.js 18+
- PostgreSQL 15+
- Docker (tùy chọn)

### Cài đặt thủ công

1. Clone repository:
   ```bash
   git clone https://github.com/yourusername/minicde.git
   cd minicde
   ```

2. Cài đặt dependencies:
   ```bash
   # Cài đặt dependencies cho cả dự án
   npm install
   
   # Cài đặt dependencies cho frontend
   cd frontend
   npm install
   cd ..
   
   # Cài đặt dependencies cho backend
   cd backend
   npm install
   cd ..
   ```

3. Cấu hình database:
   - Tạo file `.env` trong thư mục `backend` dựa trên file `.env.example`
   - Cập nhật thông tin kết nối PostgreSQL

4. Chạy migration và seed database:
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   cd ..
   ```

5. Chạy dự án ở chế độ development:
   ```bash
   # Chạy cả frontend và backend
   npm run dev
   
   # Hoặc chạy riêng lẻ
   # Frontend
   cd frontend
   npm start
   
   # Backend
   cd backend
   npm run dev
   ```

### Cài đặt với Docker

1. Clone repository:
   ```bash
   git clone https://github.com/yourusername/minicde.git
   cd minicde
   ```

2. Cấu hình môi trường:
   - Tạo file `.env` trong thư mục gốc dựa trên file `.env.example`

3. Build và chạy với Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Truy cập ứng dụng:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Cấu trúc dự án

```
/minicde/
├── frontend/                # React frontend
│   ├── src/
│   │   ├── assets/          # Icons, images
│   │   ├── components/      # Shared components
│   │   ├── features/        # Feature-based modules
│   │   ├── layouts/         # App layouts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Redux store
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── public/              # Static files
├── backend/                 # Express backend
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/     # Express middlewares
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   └── prisma/              # Database schema
└── docker-compose.yml       # Docker configuration
```

## Tài khoản demo

Sau khi chạy seed, bạn có thể đăng nhập với các tài khoản sau:

- **Admin**: admin@minicde.com / admin123
- **Project Manager**: pm@minicde.com / manager123
- **BIM Manager**: bim@minicde.com / bim123
- **Contributor**: contributor@minicde.com / contrib123
- **Viewer**: viewer@minicde.com / viewer123

## Triển khai lên Heroku

1. Tạo ứng dụng Heroku:
   ```bash
   heroku create minicde
   ```

2. Thêm PostgreSQL add-on:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

3. Cấu hình biến môi trường:
   ```bash
   heroku config:set JWT_SECRET=your_secure_jwt_secret
   heroku config:set NODE_ENV=production
   ```

4. Triển khai:
   ```bash
   git push heroku main
   ```

5. Chạy migration:
   ```bash
   heroku run npm run db:migrate
   heroku run npm run db:seed
   ```

## Giấy phép

[MIT License](LICENSE) 