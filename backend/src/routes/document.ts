import express from 'express';
import {
  getDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  uploadNewVersion,
  deleteDocument,
  getDocumentHistory,
  upload
} from '../controllers/documentController';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get documents with filtering and pagination
router.get('/', getDocuments);

// Get document by ID
router.get('/:id', getDocumentById);

// Upload file only (for frontend file upload)
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Return the file URL
    res.status(200).json({
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Upload document
router.post('/', upload.single('file'), uploadDocument);

// Update document metadata
router.put('/:id', updateDocument);

// Upload new version of document
router.post('/:id/version', upload.single('file'), uploadNewVersion);

// Delete document
router.delete('/:id', deleteDocument);

// Get document history
router.get('/:id/history', getDocumentHistory);

export default router; 