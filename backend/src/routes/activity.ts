import express from 'express';
import { getActivities } from '../controllers/activityController';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

// Get activity logs
router.get('/', authMiddleware, getActivities);

export default router; 