import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      email: string;
      role: string;
    };

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Add alias for backward compatibility with auth.js
export const authenticate = authMiddleware;

/**
 * Role-based authorization middleware
 * @param roles - Array of allowed roles
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

/**
 * Project access middleware
 * Ensures user has access to the requested project
 */
export const projectAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Lấy projectId từ params hoặc body
    const projectId = req.params.id || req.params.projectId || req.body.projectId;
    
    console.log('Project access check - User:', req.user.id, 'Project:', projectId);
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Admin has access to all projects
    if (req.user.role === 'ADMIN') {
      console.log('Admin access granted for project:', projectId);
      return next();
    }

    // Check if user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        userId: req.user.id,
        projectId: projectId
      }
    });

    if (!projectMember) {
      console.log('Access denied for user', req.user.id, 'to project', projectId);
      return res.status(403).json({ error: 'Forbidden: No access to this project' });
    }

    console.log('Access granted for user', req.user.id, 'to project', projectId);
    next();
  } catch (error) {
    console.error('Project access middleware error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}; 