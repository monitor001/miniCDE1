import { Router } from 'express';
import { getTasks, getTask, createTask, updateTask, deleteTask, addComment, addHistory } from '../controllers/taskController';
import { authMiddleware, authorize } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', authorize(['ADMIN', 'MANAGER']), createTask);
router.put('/:id', authorize(['ADMIN', 'MANAGER']), updateTask);
router.delete('/:id', authorize(['ADMIN']), deleteTask);

router.post('/:id/comment', addComment);
router.post('/:id/history', addHistory);

export default router; 