import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../middlewares/errorHandler';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { logActivity } from '../utils/activityLogger';
import { 
  generateISOName, 
  validateISOMetadata, 
  getRequiredMetadataFields,
  formatDocumentMetadata,
  canTransitionStatus 
} from '../utils/isoUtils';

// Helper functions for ISO 19650 formatting
const generateISOPath = (doc: any) => {
  const projectName = doc.project?.name || 'Project';
  const status = doc.status?.toLowerCase() || 'wip';
  const discipline = doc.metadata?.discipline || 'XX';
  const date = doc.createdAt.toISOString().split('T')[0];
  return `/${projectName}/${status.toUpperCase()}/${discipline}/${date}/${doc.name}`;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const prisma = new PrismaClient();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Get allowed file types from environment or use default
  const allowedFileTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,dwg,rvt,ifc,docx,xlsx,jpg,png')
    .split(',')
    .map(type => type.trim());
  
  const fileExt = path.extname(file.originalname).substring(1).toLowerCase();
  
  if (allowedFileTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedFileTypes.join(', ')}`));
  }
};

// Configure multer upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600') // Default 100MB
  }
});

/**
 * Get documents with filtering and pagination
 * @route GET /api/documents
 */
export const getDocuments = async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      containerId,
      status,
      search,
      page = 1,
      limit = 10
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter conditions
    const where: any = {};
    
    // Filter by project
    if (projectId) {
      // Check if user has access to the project
      const project = await prisma.project.findUnique({
        where: { id: projectId as string },
        include: {
          members: {
            where: { userId: req.user?.id }
          }
        }
      });
      
      if (!project) {
        throw new ApiError(404, 'Project not found');
      }
      
      if (req.user?.role !== 'ADMIN' && project.members.length === 0) {
        throw new ApiError(403, 'You do not have access to this project');
      }
      
      where.projectId = projectId;
    } else {
      // If no projectId provided, only show documents from projects the user has access to
      if (req.user?.role !== 'ADMIN') {
        where.project = {
          members: {
            some: { userId: req.user?.id }
          }
        };
      }
    }
    
    // Filter by container
    if (containerId) {
      where.containerId = containerId;
    }
    
    // Filter by status
    if (status) {
      where.status = status;
    }
    
    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    // Get documents with pagination
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          container: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true
            }
          },
          uploader: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.document.count({ where })
    ]);
    
    // Transform documents to include ISO 19650 metadata
    const transformedDocuments = documents.map(doc => ({
      ...doc,
      uploader: doc.uploader.name,
      projectName: doc.project.name,
      filePath: generateISOPath(doc),
      fileSize: formatFileSize(doc.fileSize),
      uploadDate: doc.createdAt.toLocaleString('vi-VN')
    }));

    res.status(200).json({
      documents: transformedDocuments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get documents error:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }
};

/**
 * Get document by ID
 * @route GET /api/documents/:id
 */
export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { userId: req.user?.id }
            }
          }
        },
        container: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        history: {
          orderBy: { createdAt: 'desc' }
        },
        tasks: {
          include: {
            task: true
          }
        }
      }
    });
    
    if (!document) {
      throw new ApiError(404, 'Document not found');
    }
    
    // Check if user has access to the project
    if (req.user?.role !== 'ADMIN' && document.project.members.length === 0) {
      throw new ApiError(403, 'You do not have access to this document');
    }
    
    res.status(200).json(document);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get document by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }
};

/**
 * Upload document
 * @route POST /api/documents
 */
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }
    
    const { 
      name, 
      description, 
      projectId, 
      containerId, 
      revisionCode, 
      metadata 
    } = req.body;
    
    // Validate required fields
    if (!name || !projectId) {
      throw new ApiError(400, 'Name and project ID are required');
    }
    
    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: req.user?.id }
        }
      }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    if (req.user?.role !== 'ADMIN' && project.members.length === 0) {
      throw new ApiError(403, 'You do not have permission to upload documents to this project');
    }
    
    // Check if container exists and belongs to the project
    let container = null;
    let status: any = 'WORK_IN_PROGRESS'; // Changed to any to avoid type error
    
    if (containerId) {
      container = await prisma.container.findUnique({
        where: { id: containerId }
      });
      
      if (!container) {
        throw new ApiError(404, 'Container not found');
      }
      
      if (container.projectId !== projectId) {
        throw new ApiError(400, 'Container does not belong to the specified project');
      }
      
      // Set document status based on container
      status = container.status;
    } else {
      // If no container specified, find the WIP container
      container = await prisma.container.findFirst({
        where: {
          projectId,
          status: 'WORK_IN_PROGRESS'
        }
      });
    }
    
    // Parse metadata if provided
    let metadataObj = {};
    if (metadata) {
      try {
        metadataObj = JSON.parse(metadata);
      } catch (error) {
        throw new ApiError(400, 'Invalid metadata format. Must be valid JSON');
      }
    }

    // Validate ISO 19650 metadata
    const validation = await validateISOMetadata(metadataObj);
    if (!validation.isValid) {
      throw new ApiError(400, `Metadata validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate ISO filename if naming rule is enabled
    let finalName = name;
    try {
      finalName = await generateISOName(req.file.originalname, projectId, metadataObj);
    } catch (error) {
      console.warn('Failed to generate ISO filename, using original name:', error);
    }
    
    // Create document with ISO naming
    const document = await prisma.document.create({
      data: {
        name: finalName,
        originalName: req.file.originalname, // Store original filename
        description: description || req.file.originalname, // Use original name as description if no description provided
        fileUrl: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        fileType: path.extname(req.file.originalname).substring(1),
        version: 1,
        revisionCode,
        status,
        metadata: metadataObj,
        projectId,
        containerId: container?.id,
        uploaderId: req.user?.id as string
      }
    });
    
    // Create document history
    await prisma.documentHistory.create({
      data: {
        documentId: document.id,
        version: 1,
        fileUrl: document.fileUrl,
        revisionCode: document.revisionCode,
        status: document.status,
        updatedBy: req.user?.id as string,
        comment: 'Initial upload'
      }
    });
    
    // Notify document upload via Socket.IO
    global.io.to(`project:${projectId}`).emit('document:uploaded', {
      document: {
        id: document.id,
        name: document.name,
        status: document.status,
        containerId: document.containerId
      },
      uploadedBy: req.user?.id
    });
    
    // Ghi log audit trail
    if (req.user?.id) {
      await logActivity({
        userId: req.user.id,
        action: 'upload',
        objectType: 'document',
        objectId: document.id,
        description: `Upload tài liệu "${name}"`
      });
    }
    
    res.status(201).json(document);
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(process.env.UPLOAD_PATH || './uploads', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else if (error instanceof Error && error.name === 'MulterError') {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Upload document error:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
};

/**
 * Update document
 * @route PUT /api/documents/:id
 */
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      revisionCode, 
      metadata,
      containerId
    } = req.body;
    
    // Find document
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { 
                userId: req.user?.id,
                role: { in: ['PROJECT_MANAGER', 'BIM_MANAGER', 'CONTRIBUTOR'] }
              }
            }
          }
        }
      }
    });
    
    if (!document) {
      throw new ApiError(404, 'Document not found');
    }
    
    // Check if user has permission
    if (req.user?.role !== 'ADMIN' && document.project.members.length === 0) {
      throw new ApiError(403, 'You do not have permission to update this document');
    }
    
    // Check if container exists and belongs to the project
    let container = null;
    let status = document.status;
    
    if (containerId && containerId !== document.containerId) {
      container = await prisma.container.findUnique({
        where: { id: containerId }
      });
      
      if (!container) {
        throw new ApiError(404, 'Container not found');
      }
      
      if (container.projectId !== document.projectId) {
        throw new ApiError(400, 'Container does not belong to the document\'s project');
      }
      
      // Update status based on container
      status = container.status;
    }
    
    // Parse metadata if provided
    let metadataObj = document.metadata || {};
    if (metadata) {
      try {
        metadataObj = JSON.parse(metadata);
      } catch (error) {
        throw new ApiError(400, 'Invalid metadata format. Must be valid JSON');
      }
    }

    // Validate ISO 19650 metadata if metadata is being updated
    if (metadata) {
      const validation = await validateISOMetadata(metadataObj);
      if (!validation.isValid) {
        throw new ApiError(400, `Metadata validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Check status transition permissions if container is changing
    if (containerId && containerId !== document.containerId) {
      const canTransition = await canTransitionStatus(
        document.status,
        status,
        req.user?.role || 'USER',
        document.projectId
      );
      
      if (!canTransition) {
        throw new ApiError(403, 'You do not have permission to perform this status transition');
      }
    }
    
    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        revisionCode: revisionCode !== undefined ? revisionCode : undefined,
        metadata: metadataObj,
        containerId: containerId !== undefined ? containerId : undefined,
        status: containerId !== document.containerId ? status : undefined
      }
    });
    
    // Create document history entry if container changed
    if (containerId && containerId !== document.containerId) {
      await prisma.documentHistory.create({
        data: {
          documentId: document.id,
          version: document.version,
          fileUrl: document.fileUrl,
          revisionCode: updatedDocument.revisionCode,
          status: updatedDocument.status,
          updatedBy: req.user?.id as string,
          comment: `Moved to ${container?.name} container`
        }
      });
    }
    
    // Notify document update via Socket.IO
    global.io.to(`project:${document.projectId}`).emit('document:updated', {
      document: {
        id: updatedDocument.id,
        name: updatedDocument.name,
        status: updatedDocument.status,
        containerId: updatedDocument.containerId
      },
      updatedBy: req.user?.id
    });
    
    // Ghi log audit trail
    if (req.user?.id) {
      await logActivity({
        userId: req.user.id,
        action: 'update',
        objectType: 'document',
        objectId: id,
        description: `Cập nhật tài liệu "${name}"`
      });
    }
    
    res.status(200).json(updatedDocument);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Update document error:', error);
      res.status(500).json({ error: 'Failed to update document' });
    }
  }
};

/**
 * Upload new version of document
 * @route POST /api/documents/:id/version
 */
export const uploadNewVersion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }
    
    const { revisionCode, comment } = req.body;
    
    // Find document
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { 
                userId: req.user?.id,
                role: { in: ['PROJECT_MANAGER', 'BIM_MANAGER', 'CONTRIBUTOR'] }
              }
            }
          }
        }
      }
    });
    
    if (!document) {
      throw new ApiError(404, 'Document not found');
    }
    
    // Check if user has permission
    if (req.user?.role !== 'ADMIN' && document.project.members.length === 0) {
      throw new ApiError(403, 'You do not have permission to update this document');
    }
    
    // Increment version
    const newVersion = document.version + 1;
    
    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        fileUrl: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        fileType: path.extname(req.file.originalname).substring(1),
        version: newVersion,
        revisionCode: revisionCode || document.revisionCode,
        updatedAt: new Date()
      }
    });
    
    // Create document history
    await prisma.documentHistory.create({
      data: {
        documentId: document.id,
        version: newVersion,
        fileUrl: updatedDocument.fileUrl,
        revisionCode: updatedDocument.revisionCode,
        status: updatedDocument.status,
        updatedBy: req.user?.id as string,
        comment: comment || `Version ${newVersion} uploaded`
      }
    });
    
    // Notify document version update via Socket.IO
    global.io.to(`project:${document.projectId}`).emit('document:version:updated', {
      document: {
        id: updatedDocument.id,
        name: updatedDocument.name,
        version: updatedDocument.version
      },
      updatedBy: req.user?.id
    });
    
    res.status(200).json(updatedDocument);
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(process.env.UPLOAD_PATH || './uploads', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else if (error instanceof Error && error.name === 'MulterError') {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Upload new version error:', error);
      res.status(500).json({ error: 'Failed to upload new version' });
    }
  }
};

/**
 * Delete document
 * @route DELETE /api/documents/:id
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find document
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { 
                userId: req.user?.id,
                role: { in: ['PROJECT_MANAGER', 'BIM_MANAGER'] }
              }
            }
          }
        },
        history: true
      }
    });
    
    if (!document) {
      throw new ApiError(404, 'Document not found');
    }
    
    // Check if user has permission
    if (req.user?.role !== 'ADMIN' && document.project.members.length === 0) {
      throw new ApiError(403, 'You do not have permission to delete this document');
    }
    
    // Get file paths to delete
    const filePaths = [
      document.fileUrl,
      ...document.history.map((h: { fileUrl: string }) => h.fileUrl)
    ].filter(Boolean);
    
    // Delete document from database
    await prisma.document.delete({
      where: { id }
    });
    
    // Delete files
    filePaths.forEach(fileUrl => {
      if (fileUrl) {
        const filePath = path.join(process.cwd(), fileUrl);
        fs.unlink(filePath, (err) => {
          if (err) console.error(`Error deleting file ${filePath}:`, err);
        });
      }
    });
    
    // Notify document deletion via Socket.IO
    global.io.to(`project:${document.projectId}`).emit('document:deleted', {
      id,
      name: document.name,
      deletedBy: req.user?.id
    });
    
    // Ghi log audit trail
    if (req.user?.id) {
      await logActivity({
        userId: req.user.id,
        action: 'delete',
        objectType: 'document',
        objectId: id,
        description: `Xoá tài liệu "${document.name}"`
      });
    }
    
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Delete document error:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }
};

/**
 * Get documents for ISO 19650 interface
 * @route GET /api/documents/iso
 */
export const getDocumentsISO = async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      status,
      search,
      discipline,
      page = 1,
      limit = 10
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter conditions
    const where: any = {};
    
    // Filter by project
    if (projectId) {
      where.projectId = projectId;
    } else {
      // If no projectId provided, only show documents from projects the user has access to
      if (req.user?.role !== 'ADMIN') {
        where.project = {
          members: {
            some: { userId: req.user?.id }
          }
        };
      }
    }
    
    // Filter by status
    if (status && status !== 'all') {
      where.status = status;
    }
    
    // Filter by discipline
    if (discipline && discipline !== 'all') {
      where.metadata = {
        path: ['discipline'],
        equals: discipline
      };
    }
    
    // Search by name, description, or original name
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { originalName: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    // Get documents with pagination
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          container: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true
            }
          },
          uploader: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.document.count({ where })
    ]);
    
    // Transform documents to include ISO 19650 metadata
    const transformedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      originalName: doc.originalName || doc.name,
      description: doc.description || doc.originalName || doc.name,
      status: doc.status.toLowerCase(),
      version: `v${doc.version}`,
      filePath: generateISOPath(doc),
      uploader: doc.uploader.name,
      uploadDate: doc.createdAt.toLocaleString('vi-VN'),
      fileSize: formatFileSize(doc.fileSize),
      metadata: doc.metadata || {},
      projectId: doc.projectId,
      projectName: doc.project.name
    }));

    res.status(200).json({
      documents: transformedDocuments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get documents ISO error:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }
};

/**
 * Get document history
 * @route GET /api/documents/:id/history
 */
export const getDocumentHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find document
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { userId: req.user?.id }
            }
          }
        }
      }
    });
    
    if (!document) {
      throw new ApiError(404, 'Document not found');
    }
    
    // Check if user has access to the project
    if (req.user?.role !== 'ADMIN' && document.project.members.length === 0) {
      throw new ApiError(403, 'You do not have access to this document');
    }
    
    // Get document history
    const history = await prisma.documentHistory.findMany({
      where: { documentId: id },
      orderBy: { createdAt: 'desc' }
    });
    
    res.status(200).json(history);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get document history error:', error);
      res.status(500).json({ error: 'Failed to fetch document history' });
    }
  }
}; 