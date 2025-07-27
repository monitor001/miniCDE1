import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { sendMail } from './utils/email';
import cron from 'node-cron';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import projectRoutes from './routes/project';
import documentRoutes from './routes/document';
import taskRoutes from './routes/task';
import containerRoutes from './routes/container';
import reportRoutes from './routes/report';
import dashboardRoutes from './routes/dashboard';
import activityRoutes from './routes/activity';
import calendarRoutes from './routes/calendar';
import issueRoutes from './routes/issue';
import activityLogRoutes from './routes/activityLog';
import isoRoutes from './routes/iso';
import settingsRoutes from './routes/settings';

// Middlewares
import { errorHandler } from './middlewares/errorHandler';
import { authMiddleware } from './middlewares/auth';
import { auditLogger } from './middlewares/auditLogger';

// Import prisma from db.ts
import { prisma } from './db';

// Reminder job: chạy mỗi phút
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const in60min = new Date(now.getTime() + 60 * 60000);
  // Lấy các sự kiện có reminder, sắp diễn ra trong 60 phút tới, chưa gửi nhắc nhở
  const events = await prisma.calendarEvent.findMany({
    where: {
      reminder: { not: null },
      startDate: { gte: now, lte: in60min },
    },
    include: { attendees: { include: { user: true } } }
  });
  for (const event of events) {
    const minutesToStart = Math.round((new Date(event.startDate).getTime() - now.getTime()) / 60000);
    if (event.reminder && minutesToStart === event.reminder) {
      for (const attendee of event.attendees) {
        if (!attendee.user?.email) continue;
        if (['ACCEPTED', 'INVITED'].includes(attendee.status || 'INVITED')) {
          await sendMail({
            to: attendee.user.email,
            subject: `[Nhắc nhở] Sự kiện: ${event.title}`,
            html: `<p>Bạn có sự kiện <b>${event.title}</b> lúc ${new Date(event.startDate).toLocaleString()}.</p><p>Vui lòng kiểm tra lịch dự án để biết chi tiết.</p>`
          });
        }
      }
    }
  }
});

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketServer(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost',
      'http://127.0.0.1',
      'http://localhost:8080',
      'http://127.0.0.1:8080'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Declare global io variable
declare global {
  var io: SocketServer;
}
global.io = io;

// Set up rate limiting with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later.'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 API requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many API requests from this IP, please try again later.'
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ],
  credentials: true
}));
app.use(helmet());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Auth middleware chỉ áp dụng cho các routes cần thiết
// app.use(authMiddleware); // Comment out global auth middleware

// Audit log middleware (log tự động mọi thao tác thay đổi dữ liệu)
app.use(auditLogger);

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use(generalLimiter);
// app.use('/api', apiLimiter); // Comment out global API rate limiter temporarily

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Temporary test endpoint (remove in production)
app.get('/api/test/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Test login endpoint
app.post('/api/test/login', async (req, res) => {
  try {
    console.log('Test login endpoint called');
    res.json({ message: 'Login endpoint accessible' });
  } catch (error) {
    res.status(500).json({ error: 'Test failed' });
  }
});

// Test auth endpoint
app.post('/api/test/auth', async (req, res) => {
  try {
    console.log('Test auth endpoint called');
    res.json({ message: 'Auth endpoint accessible' });
  } catch (error) {
    res.status(500).json({ error: 'Test failed' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/documents', authMiddleware, documentRoutes);
app.use('/api/containers', authMiddleware, containerRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/activities', authMiddleware, activityRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/calendar', authMiddleware, calendarRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/activity-logs', authMiddleware, activityLogRoutes);
app.use('/api/iso', authMiddleware, isoRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);

// Error handling
app.use(errorHandler);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('join-user', (userId: string) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User ${socket.id} joined user room user:${userId}`);
    }
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
  
  // Join project room for real-time updates
  socket.on('join-project', (projectId: string) => {
    socket.join(`project:${projectId}`);
    console.log(`User ${socket.id} joined project ${projectId}`);
  });
  
  // Leave project room
  socket.on('leave-project', (projectId: string) => {
    socket.leave(`project:${projectId}`);
    console.log(`User ${socket.id} left project ${projectId}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}); 

// Trigger Heroku rebuild