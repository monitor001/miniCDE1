import express from 'express';
import { getIssues, getIssueById, createIssue, updateIssue, deleteIssue, getIssueComments, createIssueComment } from '../controllers/issueController';
import { authMiddleware } from '../middlewares/auth';
import multer from 'multer';
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

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
// Lấy danh sách comment của issue
router.get('/:id/comments', authMiddleware, getIssueComments);
// Tạo comment cho issue (có upload file)
router.post('/:id/comments', authMiddleware, upload.array('files', 5) as any, createIssueComment);

export default router; 