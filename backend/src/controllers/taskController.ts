import { Request, Response } from 'express';
import { PrismaClient, TaskStatus, Priority, Role } from '@prisma/client';
import { Server } from 'socket.io';
import { ApiError } from '../middlewares/errorHandler';
import { logActivity } from '../utils/activityLogger';

declare const io: Server;

const prisma = new PrismaClient();

/**
 * Get all tasks with filtering and pagination
 * @route GET /api/tasks
 */
export const getTasks = async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      status, 
      priority, 
      assigneeId, 
      projectId,
      search 
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    // Build filter conditions
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Check user permissions
    if (req.user?.role !== 'ADMIN') {
      // Users can only see tasks from projects they're members of
      const userProjects = await prisma.projectMember.findMany({
        where: { userId: req.user?.id },
        select: { projectId: true }
      });
      
      const projectIds = userProjects.map(pm => pm.projectId);
      where.projectId = { in: projectIds };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          documents: {
            include: {
              document: {
                select: {
                  id: true,
                  name: true,
                  fileUrl: true
                }
              }
            }
          },
          history: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          _count: {
            select: {
              comments: true,
              documents: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: parseInt(limit as string)
      }),
      prisma.task.count({ where })
    ]);

    res.status(200).json({
      tasks,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

/**
 * Get task by ID
 * @route GET /api/tasks/:id
 */
export const getTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        project: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                  }
                }
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        documents: {
          include: {
            document: {
              select: {
                id: true,
                name: true,
                fileUrl: true,
                fileType: true,
                version: true
              }
            }
          }
        },
        history: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    // Check if user has access to this task
    if (req.user?.role !== 'ADMIN') {
      const isProjectMember = task.project.members.some(
        (member: any) => member.user.id === req.user?.id
      );
      
      if (!isProjectMember) {
        throw new ApiError(403, 'You do not have access to this task');
      }
    }

    res.status(200).json(task);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get task error:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  }
};

/**
 * Create new task
 * @route POST /api/tasks
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status, dueDate, assigneeId, projectId, priority } = req.body;

    // Validate required fields
    if (!title || !status || !projectId) {
      throw new ApiError(400, 'Title, status, and project ID are required');
    }

    if (typeof title !== 'string' || title.trim().length < 3) {
      throw new ApiError(400, 'Task title must be at least 3 characters');
    }

    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true
      }
    });

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    if (req.user?.role !== 'ADMIN') {
      const isProjectMember = project.members.some(
        (member: any) => member.userId === req.user?.id
      );
      
      if (!isProjectMember) {
        throw new ApiError(403, 'You do not have access to this project');
      }

      // Only project managers and BIM managers can create tasks
      const userMembership = project.members.find(
        (member: any) => member.userId === req.user?.id
      );
      
      if (!['PROJECT_MANAGER', 'BIM_MANAGER'].includes(userMembership?.role || '')) {
        throw new ApiError(403, 'You do not have permission to create tasks in this project');
      }
    }

    // Check if assignee exists and is a project member
    if (assigneeId) {
      try {
        const assignee = await prisma.user.findUnique({
          where: { id: assigneeId }
        });
  
        if (!assignee) {
          throw new ApiError(404, 'Assignee not found');
        }
  
        const isAssigneeMember = project.members.some(
          (member: any) => member.userId === assigneeId
        );
  
        if (!isAssigneeMember) {
          throw new ApiError(400, 'Assignee must be a member of the project');
        }
      } catch (error) {
        console.error('Error checking assignee:', error);
        throw new ApiError(400, 'Invalid assignee ID or user not found');
      }
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status as TaskStatus,
        priority: (priority as Priority) || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        projectId
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create task history
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        action: 'TASK_CREATED',
        details: `Task "${task.title}" created`,
        userId: req.user?.id as string
      }
    });

    // Emit socket event
    if (typeof io !== 'undefined') {
      io.to(`project:${projectId}`).emit('task:created', {
        task,
        createdBy: req.user?.id
      });
    }

    // Notify task creation via Socket.IO
    global.io.to(`project:${projectId}`).emit('task:created', {
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee
      },
      createdBy: req.user?.id
    });
    
    // Log activity
    if (req.user?.id) {
      await logActivity({
        userId: req.user.id,
        action: 'create',
        objectType: 'task',
        objectId: task.id,
        description: `Tạo công việc "${task.title}"`
      });
    }
    
    res.status(201).json(task);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Create task error:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
};

/**
 * Update task
 * @route PUT /api/tasks/:id
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate, assigneeId, priority } = req.body;

    // Find existing task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    });

    if (!existingTask) {
      throw new ApiError(404, 'Task not found');
    }

    // Check if user has access to this task
    if (req.user?.role !== 'ADMIN') {
      const isProjectMember = existingTask.project.members.some(
        (member: any) => member.userId === req.user?.id
      );
      
      if (!isProjectMember) {
        throw new ApiError(403, 'You do not have access to this task');
      }

      // Only project managers, BIM managers, or the assignee can update tasks
      const userMembership = existingTask.project.members.find(
        (member: any) => member.userId === req.user?.id
      );
      
      const canUpdate = ['PROJECT_MANAGER', 'BIM_MANAGER'].includes(userMembership?.role || '') ||
                       existingTask.assigneeId === req.user?.id;

      if (!canUpdate) {
        throw new ApiError(403, 'You do not have permission to update this task');
      }
    }

    // Check if assignee exists and is a project member
    if (assigneeId && assigneeId !== existingTask.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      });

      if (!assignee) {
        throw new ApiError(404, 'Assignee not found');
      }

      const isAssigneeMember = existingTask.project.members.some(
        (member: any) => member.userId === assigneeId
      );

      if (!isAssigneeMember) {
        throw new ApiError(400, 'Assignee must be a member of the project');
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length < 3) {
        throw new ApiError(400, 'Task title must be at least 3 characters');
      }
      updateData.title = title.trim();
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    
    if (status !== undefined) {
      updateData.status = status as TaskStatus;
    }
    
    if (priority !== undefined) {
      updateData.priority = priority as Priority;
    }
    
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    
    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId || null;
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create task history
    await prisma.taskHistory.create({
      data: {
        taskId: updatedTask.id,
        action: 'TASK_UPDATED',
        details: `Task "${updatedTask.title}" updated`,
        userId: req.user?.id as string
      }
    });

    // Emit socket event
    if (typeof io !== 'undefined') {
      io.to(`project:${existingTask.projectId}`).emit('task:updated', {
        task: updatedTask,
        updatedBy: req.user?.id
      });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Update task error:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
};

/**
 * Delete task
 * @route DELETE /api/tasks/:id
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find existing task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    });

    if (!existingTask) {
      throw new ApiError(404, 'Task not found');
    }

    // Check if user has permission to delete this task
    if (req.user?.role !== 'ADMIN') {
      const isProjectMember = existingTask.project.members.some(
        (member: any) => member.userId === req.user?.id
      );
      
      if (!isProjectMember) {
        throw new ApiError(403, 'You do not have access to this task');
      }

      // Only project managers and BIM managers can delete tasks
      const userMembership = existingTask.project.members.find(
        (member: any) => member.userId === req.user?.id
      );
      
      if (!['PROJECT_MANAGER', 'BIM_MANAGER'].includes(userMembership?.role || '')) {
        throw new ApiError(403, 'You do not have permission to delete this task');
      }
    }

    // Delete related records first
    await prisma.comment.deleteMany({
      where: { taskId: id }
    });

    await prisma.taskDocument.deleteMany({
      where: { taskId: id }
    });

    await prisma.taskHistory.deleteMany({
      where: { taskId: id }
    });

    // Delete task
    await prisma.task.delete({
      where: { id }
    });

    // Emit socket event
    if (typeof io !== 'undefined') {
      io.to(`project:${existingTask.projectId}`).emit('task:deleted', {
        taskId: id,
        deletedBy: req.user?.id
      });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Delete task error:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
};

/**
 * Add comment to task
 * @route POST /api/tasks/:id/comments
 */
export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new ApiError(400, 'Comment content is required');
    }

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    });

    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    if (req.user?.role !== 'ADMIN') {
      const isProjectMember = task.project.members.some(
        (member: any) => member.userId === req.user?.id
      );
      
      if (!isProjectMember) {
        throw new ApiError(403, 'You do not have access to this task');
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        taskId: id,
        userId: req.user?.id as string
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Emit socket event
    if (typeof io !== 'undefined') {
      io.to(`project:${task.projectId}`).emit('task:comment:added', {
        taskId: id,
        comment,
        addedBy: req.user?.id
      });
    }

    // Notify comment creation via Socket.IO
    global.io.to(`task:${id}`).emit('task:comment:created', {
      taskId: id,
      comment: {
        id: comment.id,
        content: comment.content,
        user: comment.user
      },
      createdBy: req.user?.id
    });
    
    // Log activity
    if (req.user?.id) {
      await logActivity({
        userId: req.user.id,
        action: 'comment',
        objectType: 'task',
        objectId: id,
        description: `Thêm bình luận cho công việc "${task.title}"`
      });
    }
    
    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Add comment error:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }
};

/**
 * Get task history
 * @route GET /api/tasks/:id/history
 */
export const getTaskHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    });

    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    if (req.user?.role !== 'ADMIN') {
      const isProjectMember = task.project.members.some(
        (member: any) => member.userId === req.user?.id
      );
      
      if (!isProjectMember) {
        throw new ApiError(403, 'You do not have access to this task');
      }
    }

    // Get task history
    const [history, total] = await Promise.all([
      prisma.taskHistory.findMany({
        where: { taskId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.taskHistory.count({
        where: { taskId: id }
      })
    ]);

    res.status(200).json({
      history,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get task history error:', error);
      res.status(500).json({ error: 'Failed to fetch task history' });
    }
  }
}; 