import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  getProjectNotes,
  createProjectNote,
  deleteProjectNote
} from '../controllers/projectController';
import { authMiddleware, authorize, projectAccess } from '../middlewares/auth';

const router = express.Router();

// Get all projects (with filtering and pagination)
router.get('/', authMiddleware, getProjects);

// Get project by ID
router.get('/:id', authMiddleware, projectAccess, getProjectById);

// Create project
router.post('/', authMiddleware, authorize(['ADMIN', 'PROJECT_MANAGER', 'BIM_MANAGER']), createProject);

// Update project
router.put('/:id', authMiddleware, projectAccess, updateProject);

// Delete project
router.delete('/:id', authMiddleware, projectAccess, deleteProject);

// Project members
router.post('/:id/members', authMiddleware, projectAccess, addProjectMember);
router.delete('/:id/members/:memberId', authMiddleware, projectAccess, removeProjectMember);
router.put('/:id/members/:memberId', authMiddleware, projectAccess, updateProjectMemberRole);

// Project notes
router.get('/:id/notes', authMiddleware, projectAccess, getProjectNotes);
router.post('/:id/notes', authMiddleware, projectAccess, createProjectNote);
router.delete('/:id/notes/:noteId', authMiddleware, projectAccess, deleteProjectNote);

export default router; 