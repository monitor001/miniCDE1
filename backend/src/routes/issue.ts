import express from 'express';
import { getIssues, getIssueById, createIssue, updateIssue, deleteIssue } from '../controllers/issueController';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

// Lấy danh sách issue
router.get('/', authMiddleware, getIssues);
// Lấy chi tiết issue
router.get('/:id', authMiddleware, getIssueById);
// Tạo mới issue
router.post('/', authMiddleware, createIssue);
// Cập nhật issue
router.put('/:id', authMiddleware, updateIssue);
// Xoá issue
router.delete('/:id', authMiddleware, deleteIssue);

export default router; 