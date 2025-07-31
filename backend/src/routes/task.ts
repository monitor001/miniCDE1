import { Router } from 'express';
import { 
  getTasks, 
  getTask, 
  createTask, 
  updateTask, 
  deleteTask, 
  addComment, 
  getTaskHistory 
} from '../controllers/taskController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// Task CRUD operations
router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Task comments and history
router.post('/:id/comments', addComment);
router.get('/:id/history', getTaskHistory);

export default router; 