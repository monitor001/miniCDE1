import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { ApiError } from '../middlewares/errorHandler';
import { logActivity } from '../utils/activityLogger';

const prisma = new PrismaClient();

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    console.log('Register request body:', req.body);
    const { email, password, name, organization, code, middleName, gender, dob, address, role, phone, department, status } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      throw new ApiError(400, 'Email, password, and name are required');
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new ApiError(409, 'User already exists');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user with proper data transformation
    const userData: any = {
      email,
      password: hashedPassword,
      name,
      role: role || 'USER', // Use provided role or default to USER
    };
    
    // Add optional fields if provided
    if (organization) userData.organization = organization;
    if (code) userData.code = code;
    if (middleName) userData.middleName = middleName;
    if (gender) userData.gender = gender;
    if (address) userData.address = address;
    if (dob) userData.dob = new Date(dob);
    if (phone) userData.phone = phone;
    if (department) userData.department = department;
    if (status) userData.status = status;
    
    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });
    
    const user = await prisma.user.create({ 
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        phone: true,
        department: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });
    console.log('User created:', { id: user.id, email: user.email, role: user.role });
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );
    
    // Return user data
    res.status(201).json({
      user: user,
      token
    });
    await logActivity({
      userId: user.id,
      action: 'register',
      objectType: 'user',
      objectId: user.id,
      description: `Đăng ký tài khoản cho email ${user.email}`
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
  const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }
    
    // Check if 2FA is enabled
    if (user.twoFactorSecret) {
      return res.status(200).json({
        requireTwoFactor: true,
        userId: user.id
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      user: userWithoutPassword,
      token
    });
    await logActivity({
      userId: user.id,
      action: 'login',
      objectType: 'user',
      objectId: user.id,
      description: `Đăng nhập hệ thống`
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
};

/**
 * Verify 2FA token
 * @route POST /api/auth/verify-2fa
 */
export const verifyTwoFactor = async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.body;
    
    // Validate input
    if (!userId || !token) {
      throw new ApiError(400, 'User ID and token are required');
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || !user.twoFactorSecret) {
      throw new ApiError(401, 'Invalid user or 2FA not enabled');
    }
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });
    
    if (!verified) {
      throw new ApiError(401, 'Invalid 2FA token');
    }
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      user: userWithoutPassword,
      token: jwtToken
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('2FA verification error:', error);
      res.status(500).json({ error: '2FA verification failed' });
    }
  }
};

/**
 * Setup 2FA
 * @route POST /api/auth/setup-2fa
 */
export const setupTwoFactor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `CDE BIM (${req.user?.email})`
    });
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');
    
    // Store temporary secret
    // In a real app, you would store this in a temporary storage or session
    // Here we're just sending it back to the client
    
    res.status(200).json({
      secret: secret.base32,
      qrCodeUrl
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('2FA setup error:', error);
      res.status(500).json({ error: '2FA setup failed' });
    }
  }
};

/**
 * Verify and enable 2FA
 * @route POST /api/auth/enable-2fa
 */
export const enableTwoFactor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { secret, token } = req.body;
    
    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }
    
    if (!secret || !token) {
      throw new ApiError(400, 'Secret and token are required');
    }
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token
    });
    
    if (!verified) {
      throw new ApiError(401, 'Invalid 2FA token');
    }
    
    // Save secret to user
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret }
    });
    
    res.status(200).json({
      message: '2FA enabled successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('2FA enable error:', error);
      res.status(500).json({ error: '2FA enable failed' });
    }
  }
};

/**
 * Disable 2FA
 * @route POST /api/auth/disable-2fa
 */
export const disableTwoFactor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }
    
    // Remove 2FA secret
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null }
    });
    
    res.status(200).json({
      message: '2FA disabled successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('2FA disable error:', error);
      res.status(500).json({ error: '2FA disable failed' });
    }
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        createdAt: true,
        updatedAt: true,
        // Include whether 2FA is enabled, but not the secret
        twoFactorSecret: true
      }
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Convert twoFactorSecret to boolean indicating if 2FA is enabled
    const { twoFactorSecret, ...userInfo } = user;
    
    res.status(200).json({
      ...userInfo,
      twoFactorEnabled: !!twoFactorSecret
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Failed to get user information' });
    }
  }
};

/**
 * Update current user profile
 * @route PUT /api/auth/me
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }
    
    const { name, email, organization } = req.body;
    
    // Validate input
    if (!name || !email) {
      throw new ApiError(400, 'Name and email are required');
    }
    
    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId }
      }
    });
    
    if (existingUser) {
      throw new ApiError(409, 'Email is already taken');
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        organization: organization || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.status(200).json(updatedUser);
    
    await logActivity({
      userId,
      action: 'update_profile',
      objectType: 'user',
      objectId: userId,
      description: `Cập nhật thông tin cá nhân`
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new ApiError(400, 'Email is required');
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return res.status(200).json({
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
    
    // In a real application, generate a reset token and send email
    // For this example, we'll just return a success message
    
    res.status(200).json({
      message: 'If your email is registered, you will receive a password reset link'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Password reset request failed' });
    }
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      throw new ApiError(400, 'Token and password are required');
    }
    
    // In a real application, verify the reset token and update the password
    // For this example, we'll just return a success message
    
    res.status(200).json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  }
}; 