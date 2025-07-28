declare module 'jsonwebtoken';
declare module 'uuid';
declare module 'speakeasy';
declare module 'qrcode';
declare module 'nodemailer';
declare module 'bcryptjs';
declare module 'multer';
declare module 'node-cron';
declare module 'socket.io';
declare module 'redis';
declare module 'pg';
declare module 'dayjs';
declare module 'compression';
declare module 'cors';
declare module 'helmet';
declare module 'express-rate-limit';
declare module 'express-slow-down';

// Extend Express namespace for Multer
declare namespace Express {
  export interface Multer {
    File: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    };
  }
} 