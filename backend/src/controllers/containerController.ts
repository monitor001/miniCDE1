import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../middlewares/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Get containers for a project
 * @route GET /api/containers?projectId=:projectId
 */
export const getContainers = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    
    if (!projectId) {
      throw new ApiError(400, 'Project ID is required');
    }
    
    // Check if project exists and user has access
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
    
    // Get containers
    const containers = await prisma.container.findMany({
      where: { projectId: projectId as string },
      include: {
        _count: {
          select: { documents: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    res.status(200).json(containers);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get containers error:', error);
      res.status(500).json({ error: 'Failed to fetch containers' });
    }
  }
};

/**
 * Get container by ID
 * @route GET /api/containers/:id
 */
export const getContainerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const container = await prisma.container.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { userId: req.user?.id }
            }
          }
        },
        documents: {
          orderBy: { updatedAt: 'desc' },
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    if (!container) {
      throw new ApiError(404, 'Container not found');
    }
    
    // Check if user has access to the project
    if (req.user?.role !== 'ADMIN' && container.project.members.length === 0) {
      throw new ApiError(403, 'You do not have access to this container');
    }
    
    res.status(200).json(container);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get container by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch container' });
    }
  }
};

/**
 * Create container
 * @route POST /api/containers
 */
export const createContainer = async (req: Request, res: Response) => {
  try {
    const { name, code, status, projectId } = req.body;
    
    // Validate input
    if (!name || !code || !status || !projectId) {
      throw new ApiError(400, 'Name, code, status, and project ID are required');
    }
    
    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { 
            userId: req.user?.id,
            role: { in: ['PROJECT_MANAGER', 'BIM_MANAGER'] }
          }
        }
      }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    if (req.user?.role !== 'ADMIN' && project.members.length === 0) {
      throw new ApiError(403, 'You do not have permission to create containers in this project');
    }
    
    // Validate container status
    const validStatuses = ['WORK_IN_PROGRESS', 'SHARED', 'PUBLISHED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid container status');
    }
    
    // Create container
    const container = await prisma.container.create({
      data: {
        name,
        code,
        status,
        projectId
      }
    });
    
    // Notify container creation via Socket.IO
    global.io.to(`project:${projectId}`).emit('container:created', {
      container,
      createdBy: req.user?.id
    });
    
    res.status(201).json(container);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Create container error:', error);
      res.status(500).json({ error: 'Failed to create container' });
    }
  }
};

/**
 * Update container
 * @route PUT /api/containers/:id
 */
export const updateContainer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, status } = req.body;
    
    // Find container
    const container = await prisma.container.findUnique({
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
        }
      }
    });
    
    if (!container) {
      throw new ApiError(404, 'Container not found');
    }
    
    // Check if user has permission
    if (req.user?.role !== 'ADMIN' && container.project.members.length === 0) {
      throw new ApiError(403, 'You do not have permission to update this container');
    }
    
    // Validate container status if provided
    if (status) {
      const validStatuses = ['WORK_IN_PROGRESS', 'SHARED', 'PUBLISHED', 'ARCHIVED'];
      if (!validStatuses.includes(status)) {
        throw new ApiError(400, 'Invalid container status');
      }
    }
    
    // Update container
    const updatedContainer = await prisma.container.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        code: code !== undefined ? code : undefined,
        status: status !== undefined ? status : undefined
      }
    });
    
    // Notify container update via Socket.IO
    global.io.to(`project:${container.projectId}`).emit('container:updated', {
      container: updatedContainer,
      updatedBy: req.user?.id
    });
    
    res.status(200).json(updatedContainer);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Update container error:', error);
      res.status(500).json({ error: 'Failed to update container' });
    }
  }
};

/**
 * Delete container
 * @route DELETE /api/containers/:id
 */
export const deleteContainer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find container
    const container = await prisma.container.findUnique({
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
        documents: {
          select: { id: true }
        }
      }
    });
    
    if (!container) {
      throw new ApiError(404, 'Container not found');
    }
    
    // Check if user has permission
    if (req.user?.role !== 'ADMIN' && container.project.members.length === 0) {
      throw new ApiError(403, 'You do not have permission to delete this container');
    }
    
    // Check if container has documents
    if (container.documents.length > 0) {
      throw new ApiError(400, 'Cannot delete container with documents. Move or delete documents first.');
    }
    
    // Delete container
    await prisma.container.delete({
      where: { id }
    });
    
    // Notify container deletion via Socket.IO
    global.io.to(`project:${container.projectId}`).emit('container:deleted', {
      id,
      name: container.name,
      deletedBy: req.user?.id
    });
    
    res.status(200).json({ message: 'Container deleted successfully' });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Delete container error:', error);
      res.status(500).json({ error: 'Failed to delete container' });
    }
  }
};

/**
 * Move documents between containers
 * @route POST /api/containers/:id/move-documents
 */
export const moveDocuments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { documentIds } = req.body;
    
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      throw new ApiError(400, 'Document IDs are required');
    }
    
    // Find container
    const container = await prisma.container.findUnique({
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
    
    if (!container) {
      throw new ApiError(404, 'Container not found');
    }
    
    // Check if user has permission
    if (req.user?.role !== 'ADMIN' && container.project.members.length === 0) {
      throw new ApiError(403, 'You do not have permission to move documents to this container');
    }
    
    // Check if documents exist and belong to the same project
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        projectId: container.projectId
      }
    });
    
    if (documents.length !== documentIds.length) {
      throw new ApiError(400, 'One or more documents not found or do not belong to the same project');
    }
    
    // Update documents with new container
    await prisma.document.updateMany({
      where: {
        id: { in: documentIds }
      },
      data: {
        containerId: id,
        // Update status based on container status
        status: container.status
      }
    });
    
    // Create document history entries
    await Promise.all(documents.map((doc: any) => 
      prisma.documentHistory.create({
        data: {
          documentId: doc.id,
          version: doc.version,
          fileUrl: doc.fileUrl,
          revisionCode: doc.revisionCode,
          status: container.status,
          updatedBy: req.user?.id as string,
          comment: `Moved to ${container.name} container`
        }
      })
    ));
    
    // Notify document move via Socket.IO
    global.io.to(`project:${container.projectId}`).emit('documents:moved', {
      documentIds,
      containerId: id,
      containerName: container.name,
      movedBy: req.user?.id
    });
    
    res.status(200).json({
      message: `${documents.length} documents moved to ${container.name} container`
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Move documents error:', error);
      res.status(500).json({ error: 'Failed to move documents' });
    }
  }
}; 