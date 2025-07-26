import { Router } from 'express';
import { getStats } from '../controllers/reportController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.get('/stats', getStats);

export default router; 