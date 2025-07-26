import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  
  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    // Handle unique constraint errors
    if ((err as any).code === 'P2002') {
      return res.status(409).json({
        error: 'Resource already exists',
        details: `A record with this ${(err as any).meta?.target || 'field'} already exists`
      });
    }
    
    // Handle foreign key constraint errors
    if ((err as any).code === 'P2003') {
      return res.status(400).json({
        error: 'Invalid relationship',
        details: `Related record does not exist`
      });
    }
    
    // Handle record not found errors
    if ((err as any).code === 'P2001') {
      return res.status(404).json({
        error: 'Resource not found',
        details: 'The requested resource does not exist'
      });
    }
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.message
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication error',
      details: 'Invalid or expired token'
    });
  }
  
  // Handle custom API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.name,
      details: err.message
    });
  }
  
  // Handle unexpected errors
  return res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
}; 