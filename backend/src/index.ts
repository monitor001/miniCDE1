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

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://your-actual-heroku-app-name.herokuapp.com',
        'https://your-frontend-domain.com',
        'https://*.herokuapp.com', // Allow any Heroku subdomain
        'https://*.vercel.app',    // Allow Vercel deployments
        'https://*.netlify.app'    // Allow Netlify deployments
      ]
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost',
        'http://127.0.0.1',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        // Allow all localhost for development
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

// Initialize Socket.IO
const io = new SocketServer(server, {
  cors: corsOptions
});

// Declare global io variable
declare global {
  var io: SocketServer;
}
global.io = io;

// Set up rate limiting with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '50'), // limit each IP to 50 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later.'
});

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // limit each IP to 1000 API requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many API requests from this IP, please try again later.'
});

// Middleware
app.use(cors(corsOptions));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '20mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '20mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Audit log middleware (log tự động mọi thao tác thay đổi dữ liệu)
app.use(auditLogger);

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
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
const PORT = parseInt(process.env.PORT || '3001');
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}); 

// Trigger Heroku rebuild