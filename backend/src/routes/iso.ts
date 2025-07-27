import express from 'express';
import { 
  getISOConfig, 
  updateISOConfig, 
  getDocumentStatuses, 
  getMetadataFields, 
  getApprovalSteps, 
  getFileNamingRules 
} from '../controllers/isoController';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ISO 19650 Configuration Routes
router.get('/config', getISOConfig);
router.put('/config', updateISOConfig);

// Individual ISO 19650 Components
router.get('/statuses', getDocumentStatuses);
router.get('/metadata-fields', getMetadataFields);
router.get('/approval-steps', getApprovalSteps);
router.get('/file-naming', getFileNamingRules);

export default router; 