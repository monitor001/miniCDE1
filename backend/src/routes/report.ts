import { Router } from 'express';
import { getReports, createReport, getStats } from '../controllers/reportController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// Lấy danh sách báo cáo
router.get('/', getReports);

// Tạo báo cáo mới
router.post('/', createReport);

// Lấy thống kê
router.get('/stats', getStats);

export default router; 