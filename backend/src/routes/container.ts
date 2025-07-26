import express from 'express';
import {
  getContainers,
  getContainerById,
  createContainer,
  updateContainer,
  deleteContainer,
  moveDocuments
} from '../controllers/containerController';
import { authenticate as authMiddleware } from '../middlewares/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get containers for a project
router.get('/', getContainers);

// Get container by ID
router.get('/:id', getContainerById);

// Create container
router.post('/', createContainer);

// Update container
router.put('/:id', updateContainer);

// Delete container
router.delete('/:id', deleteContainer);

// Move documents to container
router.post('/:id/move-documents', moveDocuments);

export default router; 