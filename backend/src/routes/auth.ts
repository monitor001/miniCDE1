import express from 'express';
import {
  register,
  login,
  verifyTwoFactor,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  resetPassword
} from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

// Public routes
router.post('/register', register); // Temporarily enabled for testing
router.post('/login', login);
router.post('/verify-2fa', verifyTwoFactor);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.put('/me', authMiddleware, updateProfile);
router.post('/setup-2fa', authMiddleware, setupTwoFactor);
router.post('/enable-2fa', authMiddleware, enableTwoFactor);
router.post('/disable-2fa', authMiddleware, disableTwoFactor);

export default router; 