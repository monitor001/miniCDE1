import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { ApiError } from '../middlewares/errorHandler';
import { ProjectMemberWithUser, Member } from '../types/global';
import { logActivity } from '../utils/activityLogger';

const prisma = new PrismaClient();

/**
 * Get all projects (with filtering and pagination)
 * @route GET /api/projects
 */
export const getProjects = async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      search, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter conditions
    const where: any = {};
    
    // Filter by status if provided
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
    
    // For non-admin users, only show projects they are members of
    if (req.user?.role !== 'ADMIN') {
      where.members = {
        some: {
          userId: req.user?.id
        }
      };
    }
    
    // Optimized query with selective includes and counts
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          startDate: true,
          endDate: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
          // Optimize member selection - only get essential data
          members: {
            select: {
              role: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          },
          // Use _count for better performance than counting related records
          _count: {
            select: {
              documents: true,
              tasks: true,
              containers: true,
              notes: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.project.count({ where })
    ]);
    
    res.status(200).json({
      projects,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

/**
 * Get project by ID
 * @route GET /api/projects/:id
 */
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user has access to this project
    const projectAccess = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { members: { some: { userId: req.user?.id } } },
          { /* Admin can access all projects */ }
        ]
      },
      select: { id: true }
    });
    
    if (!projectAccess && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'You do not have access to this project');
    }
    
    // Optimized query with selective includes
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                organization: true
              }
            }
          }
        },
        documents: {
          select: {
            id: true,
            name: true,
            description: true,
            fileUrl: true,
            fileSize: true,
            fileType: true,
            version: true,
            status: true,
            createdAt: true,
            uploader: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50 // Limit recent documents
        },
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            createdAt: true,
            assignee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50 // Limit recent tasks
        },
        containers: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        notes: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20 // Limit recent notes
        },
        _count: {
          select: {
            documents: true,
            tasks: true,
            containers: true,
            notes: true
          }
        }
      }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    res.status(200).json(project);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get project by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  }
};

/**
 * Create project
 * @route POST /api/projects
 */
export const createProject = async (req: Request, res: Response) => {
  try {
    // Extract and validate project data
    const { name, description, status, startDate, endDate, priority, memberIds } = req.body;
    
    // Validate input
    if (!name || !status) {
      throw new ApiError(400, 'Name and status are required');
    }
    
    if (typeof name !== 'string' || name.trim().length < 3) {
      throw new ApiError(400, 'Tên dự án phải có ít nhất 3 ký tự');
    }
    
    // Validate status
    const validStatuses = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid project status: ${status}. Valid values are: ${validStatuses.join(', ')}`);
    }
    
    // Validate dates if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      throw new ApiError(400, 'Invalid start date format');
    }
    
    if (endDate && isNaN(Date.parse(endDate))) {
      throw new ApiError(400, 'Invalid end date format');
    }
    
    // Validate priority if provided
    if (priority) {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      if (!validPriorities.includes(priority)) {
        throw new ApiError(400, 'Invalid priority value');
      }
    }
    
    // Validate memberIds if provided
    let validatedMemberIds: string[] = [];
    if (memberIds && Array.isArray(memberIds)) {
      // Filter out invalid memberIds
      validatedMemberIds = memberIds.filter(id => typeof id === 'string' && id.length > 0);
    }
    
    // Create project with current user as a member
    const project = await prisma.$transaction(async (prisma) => {
      // First create the project
      const newProject = await prisma.project.create({
      data: {
          name: name.trim(),
          description: description ? description.trim() : null,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority: priority || null,
        }
      });
      
      // Then add project members
      try {
        // Add current user as project manager
        await prisma.projectMember.create({
          data: {
              userId: req.user?.id as string,
            projectId: newProject.id,
              role: Role.PROJECT_MANAGER
          }
        });
        
            // Add other members if provided
        if (validatedMemberIds.length > 0) {
          await prisma.projectMember.createMany({
            data: validatedMemberIds.map((memberId: string) => ({
              userId: memberId,
              projectId: newProject.id,
              role: Role.CONTRIBUTOR
            })),
            skipDuplicates: true
          });
        }
        
        return newProject;
      } catch (error) {
        console.error('Error adding project members:', error);
        throw new ApiError(500, 'Failed to add project members');
      }
    });
    
    // Fetch complete project with members
    const projectWithMembers = await prisma.project.findUnique({
      where: { id: project.id },
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
    });
    
    if (!projectWithMembers) {
      throw new ApiError(500, 'Failed to fetch project after creation');
    }
    
    // Create default containers according to ISO 19650
    try {
    await prisma.container.createMany({
      data: [
        {
          name: 'Work in Progress',
          code: 'WIP',
          status: 'WORK_IN_PROGRESS',
          projectId: project.id
        },
        {
          name: 'Shared',
          code: 'S',
          status: 'SHARED',
          projectId: project.id
        },
        {
          name: 'Published',
          code: 'P',
          status: 'PUBLISHED',
          projectId: project.id
        },
        {
          name: 'Archive',
          code: 'A',
          status: 'ARCHIVED',
          projectId: project.id
        }
      ]
    });
    } catch (error) {
      console.error('Error creating default containers:', error);
      // Continue execution even if container creation fails
    }
    
    // Notify project creation via Socket.IO
    try {
    global.io.emit('project:created', {
      id: project.id,
      name: project.name,
      createdBy: req.user?.id
    });
    } catch (error) {
      console.error('Error emitting socket event:', error);
    }
    
    // Log activity
    if (req.user?.id) {
      try {
      await logActivity({
        userId: req.user.id,
        action: 'create',
        objectType: 'project',
        objectId: project.id,
        description: `Tạo dự án mới: "${project.name}"`,
        notify: true
      });
      } catch (error) {
        console.error('Error logging activity:', error);
      }
    }
    
    res.status(201).json(projectWithMembers);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
};

/**
 * Update project
 * @route PUT /api/projects/:id
 */
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status, startDate, endDate, priority, members } = req.body;
    
    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!existingProject) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if user has permission to update the project
    if (req.user?.role !== 'ADMIN') {
      const userMembership = existingProject.members.find((member: Member) => member.userId === req.user?.id);
      
      if (!userMembership) {
        throw new ApiError(403, 'You do not have access to this project');
      }
      
      if (!['PROJECT_MANAGER', 'BIM_MANAGER'].includes(userMembership.role)) {
        throw new ApiError(403, 'You do not have permission to update this project');
      }
    }

    // --- Cập nhật thành viên dự án ---
    if (Array.isArray(members)) {
      // Lấy danh sách userId hiện tại
      const currentMembers = existingProject.members.map((m: any) => m.userId);
      const newMembers = members.map((m: any) => m.userId);

      // Xoá các thành viên không còn trong danh sách mới
      const toRemove = currentMembers.filter((userId: string) => !newMembers.includes(userId));
      await prisma.projectMember.deleteMany({
        where: {
          projectId: id,
          userId: { in: toRemove }
        }
      });

      // Thêm mới các thành viên chưa có
      const toAdd = members.filter((m: any) => !currentMembers.includes(m.userId));
      await prisma.projectMember.createMany({
        data: toAdd.map((m: any) => ({
          projectId: id,
          userId: m.userId,
          role: m.role
        })),
        skipDuplicates: true
      });

      // Cập nhật role cho các thành viên đã có nếu thay đổi
      for (const m of members) {
        const existing = existingProject.members.find((em: any) => em.userId === m.userId);
        if (existing && existing.role !== m.role) {
          await prisma.projectMember.update({
            where: { id: existing.id },
            data: { role: m.role }
          });
        }
      }
    }
    // --- End cập nhật thành viên ---

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description: description || null,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority: priority || null
      },
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
    });
    
    // Notify project update via Socket.IO
    global.io.to(`project:${id}`).emit('project:updated', {
      id: updatedProject.id,
      name: updatedProject.name,
      updatedBy: req.user?.id
    });
    
    // Log activity
    if (req.user?.id) {
      await logActivity({
        userId: req.user.id,
        action: 'update',
        objectType: 'project',
        objectId: updatedProject.id,
        description: `Cập nhật dự án "${updatedProject.name}"`
      });
    }
    
    res.status(200).json(updatedProject);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
};

/**
 * Delete project
 * @route DELETE /api/projects/:id
 */
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if project exists with minimal data
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        members: {
          select: {
            userId: true,
            role: true
      }
        }
      }
    });
    
    if (!existingProject) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if user has permission to delete the project
    if (req.user?.role !== 'ADMIN') {
      const userMembership = existingProject.members.find((member: any) => member.userId === req.user?.id);
      
      if (!userMembership || userMembership.role !== 'PROJECT_MANAGER') {
        throw new ApiError(403, 'You do not have permission to delete this project');
      }
    }
    
    // Send response immediately to avoid timeout
    res.status(200).json({ message: 'Project deletion in progress' });
    
    // Use Prisma transaction for better performance and reliability
    await prisma.$transaction(async (prisma) => {
      // Delete related records in an optimized order
      
      // 1. Delete activity logs first (no dependencies)
      await prisma.activityLog.deleteMany({
        where: {
          objectId: id,
          objectType: 'project'
        }
      });
    
      // 2. Get task IDs for this project (needed for related deletions)
      const taskIds = await prisma.task.findMany({
      where: { projectId: id },
      select: { id: true }
      }).then(tasks => tasks.map(task => task.id));
    
      // 3. Delete task-related records if there are tasks
    if (taskIds.length > 0) {
        // Delete task history records
      await prisma.taskHistory.deleteMany({
        where: { taskId: { in: taskIds } }
      });
      
        // Delete task comments
      await prisma.comment.deleteMany({
          where: { taskId: { in: taskIds } }
      });
      
      // Delete task-document relationships
      await prisma.taskDocument.deleteMany({
        where: { taskId: { in: taskIds } }
      });
    }
    
      // 4. Delete document histories
    await prisma.documentHistory.deleteMany({
      where: { document: { projectId: id } }
    });
    
      // 5. Delete documents
    await prisma.document.deleteMany({
      where: { projectId: id }
    });
    
      // 6. Delete tasks
    await prisma.task.deleteMany({
      where: { projectId: id }
    });
    
      // 7. Delete calendar event attendees first (foreign key constraint)
      const calendarEvents = await prisma.calendarEvent.findMany({
        where: { projectId: id },
        select: { id: true }
      });
      
      const calendarEventIds = calendarEvents.map(event => event.id);
      
      if (calendarEventIds.length > 0) {
        await prisma.calendarEventAttendee.deleteMany({
          where: { eventId: { in: calendarEventIds } }
    });
      }

      // 8. Delete other project-related records
      await Promise.all([
        // These can be deleted in parallel
        prisma.container.deleteMany({ where: { projectId: id } }),
        prisma.projectNote.deleteMany({ where: { projectId: id } }),
        prisma.issue.deleteMany({ where: { projectId: id } }),
        prisma.calendarEvent.deleteMany({ where: { projectId: id } }),
        prisma.projectMember.deleteMany({ where: { projectId: id } })
      ]);

      // 8. Finally delete the project
    await prisma.project.delete({
      where: { id }
      });
    });
    
    // Notify project deletion via Socket.IO
    global.io.emit('project:deleted', {
      id,
      name: existingProject.name,
      deletedBy: req.user?.id
    });
    
    // Log activity
    if (req.user?.id) {
      await logActivity({
        userId: req.user.id,
        action: 'delete',
        objectType: 'project',
        objectId: id,
        description: `Xóa dự án "${existingProject.name}"`
      });
    }
    
    // Response already sent
  } catch (error) {
    console.error('Delete project error:', error);
    
    // Only send error response if response hasn't been sent yet
    if (!res.headersSent) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete project' });
      }
    }
  }
};

/**
 * Add member to project
 * @route POST /api/projects/:id/members
 */
export const addProjectMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      throw new ApiError(400, 'User ID and role are required');
    }
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if user has permission to add members
    if (req.user?.role !== 'ADMIN') {
      const userMembership = project.members.find((member: Member) => member.userId === req.user?.id);
      
      if (!userMembership) {
        throw new ApiError(403, 'You do not have access to this project');
      }
      
      if (!['PROJECT_MANAGER', 'BIM_MANAGER'].includes(userMembership.role)) {
        throw new ApiError(403, 'You do not have permission to add members to this project');
      }
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Check if user is already a member
    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: id
        }
      }
    });
    
    if (existingMembership) {
      throw new ApiError(409, 'User is already a member of this project');
    }
    
    // Add member
    const member = await prisma.projectMember.create({
      data: {
        userId,
        projectId: id,
        role
      },
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
    });
    
    // Notify member addition via Socket.IO
    global.io.to(`project:${id}`).emit('project:member:added', {
      projectId: id,
      member: {
        id: member.id,
        userId: member.userId,
        role: member.role,
        user: member.user
      },
      addedBy: req.user?.id
    });
    
    res.status(201).json(member);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Add project member error:', error);
      res.status(500).json({ error: 'Failed to add member to project' });
    }
  }
};

/**
 * Remove member from project
 * @route DELETE /api/projects/:id/members/:memberId
 */
export const removeProjectMember = async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if user has permission to remove members
    if (req.user?.role !== 'ADMIN') {
      const userMembership = project.members.find((member: Member) => member.userId === req.user?.id);
      
      if (!userMembership) {
        throw new ApiError(403, 'You do not have access to this project');
      }
      
      if (!['PROJECT_MANAGER', 'BIM_MANAGER'].includes(userMembership.role)) {
        throw new ApiError(403, 'You do not have permission to remove members from this project');
      }
    }
    
    // Find the member
    const member = await prisma.projectMember.findUnique({
      where: {
        id: memberId
      },
      include: {
        user: true
      }
    });
    
    if (!member || member.projectId !== id) {
      throw new ApiError(404, 'Member not found in this project');
    }
    
    // Prevent removing the last project manager
    if (member.role === 'PROJECT_MANAGER') {
      const projectManagers = project.members.filter((m: Member) => m.role === 'PROJECT_MANAGER');
      if (projectManagers.length === 1 && projectManagers[0].id === memberId) {
        throw new ApiError(400, 'Cannot remove the last project manager');
      }
    }
    
    // Remove member
    await prisma.projectMember.delete({
      where: {
        id: memberId
      }
    });
    
    // Notify member removal via Socket.IO
    global.io.to(`project:${id}`).emit('project:member:removed', {
      projectId: id,
      memberId,
      userId: member.userId,
      removedBy: req.user?.id
    });
    
    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Remove project member error:', error);
      res.status(500).json({ error: 'Failed to remove member from project' });
    }
  }
};

/**
 * Update member role in project
 * @route PUT /api/projects/:id/members/:memberId
 */
export const updateProjectMemberRole = async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    
    if (!role) {
      throw new ApiError(400, 'Role is required');
    }
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if user has permission to update member roles
    if (req.user?.role !== 'ADMIN') {
      const userMembership = project.members.find((member: Member) => member.userId === req.user?.id);
      
      if (!userMembership) {
        throw new ApiError(403, 'You do not have access to this project');
      }
      
      if (!['PROJECT_MANAGER'].includes(userMembership.role)) {
        throw new ApiError(403, 'You do not have permission to update member roles in this project');
      }
    }
    
    // Find the member
    const member = await prisma.projectMember.findUnique({
      where: {
        id: memberId
      }
    });
    
    if (!member || member.projectId !== id) {
      throw new ApiError(404, 'Member not found in this project');
    }
    
    // Prevent removing the last project manager
    if (member.role === 'PROJECT_MANAGER' && role !== 'PROJECT_MANAGER') {
      const projectManagers = project.members.filter((m: Member) => m.role === 'PROJECT_MANAGER');
      if (projectManagers.length === 1 && projectManagers[0].id === memberId) {
        throw new ApiError(400, 'Cannot change role of the last project manager');
      }
    }
    
    // Update member role
    const updatedMember = await prisma.projectMember.update({
      where: {
        id: memberId
      },
      data: {
        role
      },
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
    });
    
    // Notify member role update via Socket.IO
    global.io.to(`project:${id}`).emit('project:member:updated', {
      projectId: id,
      member: updatedMember,
      updatedBy: req.user?.id
    });
    
    res.status(200).json(updatedMember);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Update project member role error:', error);
      res.status(500).json({ error: 'Failed to update member role' });
    }
  }
};

/**
 * Get project notes
 * @route GET /api/projects/:id/notes
 */
export const getProjectNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if user has access to this project
    if (req.user?.role !== 'ADMIN') {
      const isMember = project.members.some((member: any) => 
        member.userId === req.user?.id
      );
      if (!isMember) {
        throw new ApiError(403, 'You do not have access to this project');
      }
    }
    
    // Get notes with user details using Prisma
    const notes = await prisma.projectNote.findMany({
      where: { projectId: id },
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
    });
    
    res.status(200).json(notes);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get project notes error:', error);
      res.status(500).json({ error: 'Failed to fetch project notes' });
    }
  }
};

/**
 * Create project note
 * @route POST /api/projects/:id/notes
 */
export const createProjectNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    console.log('Creating note for project:', id);
    console.log('Note content:', content);
    console.log('User:', req.user);
    
    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new ApiError(400, 'Note title is required');
    }
    if (!content || typeof content !== 'string' || content.trim() === '') {
      throw new ApiError(400, 'Note content is required');
    }
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if user has access to this project
    if (req.user?.role !== 'ADMIN') {
      const isMember = project.members.some((member: any) => 
        member.userId === req.user?.id
      );
      if (!isMember) {
        throw new ApiError(403, 'You do not have access to this project');
      }
    }
    
    // Create note using Prisma
    const note = await prisma.projectNote.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        projectId: id,
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
    
    // Notify note creation via Socket.IO
    global.io.to(`project:${id}`).emit('project:note:created', {
      projectId: id,
      note: {
        id: note.id,
        content: note.content,
        user: note.user
      },
      createdBy: req.user?.id
    });
    
    // Log activity
    if (req.user?.id) {
      await logActivity({
        userId: req.user.id,
        action: 'comment',
        objectType: 'project',
        objectId: id,
        description: `Thêm ghi chú cho dự án "${project.name}"`
      });
    }
    
    res.status(201).json(note);
  } catch (error) {
    console.error('Create project note error:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create project note' });
    }
  }
};

/**
 * Update project note
 * @route PUT /api/projects/:id/notes/:noteId
 */
export const updateProjectNote = async (req: Request, res: Response) => {
  try {
    const { id, noteId } = req.params;
    const { title, content } = req.body;
    
    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new ApiError(400, 'Note title is required');
    }
    if (!content || typeof content !== 'string' || content.trim() === '') {
      throw new ApiError(400, 'Note content is required');
    }
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if user has access to this project
    if (req.user?.role !== 'ADMIN') {
      const isMember = project.members.some((member: any) => 
        member.userId === req.user?.id
      );
      if (!isMember) {
        throw new ApiError(403, 'You do not have access to this project');
      }
    }
    
    // Check if note exists using Prisma
    const note = await prisma.projectNote.findUnique({
      where: { id: noteId }
    });
    
    if (!note || note.projectId !== id) {
      throw new ApiError(404, 'Note not found in this project');
    }
    
    // Check if user has permission (admin, project manager, or note creator)
    const hasPermission = 
      req.user?.role === 'ADMIN' ||
      project.members.some((member: any) => 
        member.userId === req.user?.id && 
        ['PROJECT_MANAGER', 'BIM_MANAGER'].includes(member.role)
      ) ||
      note.userId === req.user?.id;
    
    if (!hasPermission) {
      throw new ApiError(403, 'You do not have permission to update this note');
    }
    
    // Update note using Prisma
    const updatedNote = await prisma.projectNote.update({
      where: { id: noteId },
      data: {
        title: title.trim(),
        content: content.trim(),
        updatedAt: new Date()
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
    
    // Notify note update via Socket.IO
    global.io.to(`project:${id}`).emit('project:note:updated', {
      projectId: id,
      note: updatedNote,
      updatedBy: req.user?.id
    });
    
    res.status(200).json(updatedNote);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Update project note error:', error);
      res.status(500).json({ error: 'Failed to update project note' });
    }
  }
};

/**
 * Delete project note
 * @route DELETE /api/projects/:id/notes/:noteId
 */
export const deleteProjectNote = async (req: Request, res: Response) => {
  try {
    const { id, noteId } = req.params;
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if note exists using Prisma
    const note = await prisma.projectNote.findUnique({
      where: { id: noteId }
    });
    
    if (!note || note.projectId !== id) {
      throw new ApiError(404, 'Note not found in this project');
    }
    
    // Check if user has permission (admin, project manager, or note creator)
    const hasPermission = 
      req.user?.role === 'ADMIN' ||
      project.members.some((member: any) => 
        member.userId === req.user?.id && 
        ['PROJECT_MANAGER', 'BIM_MANAGER'].includes(member.role)
      ) ||
      note.userId === req.user?.id;
    
    if (!hasPermission) {
      throw new ApiError(403, 'You do not have permission to delete this note');
    }
    
    // Delete note using Prisma
    await prisma.projectNote.delete({
      where: { id: noteId }
    });
    
    // Notify note deletion via Socket.IO
    global.io.to(`project:${id}`).emit('project:note:deleted', {
      projectId: id,
      noteId,
      deletedBy: req.user?.id
    });
    
    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Delete project note error:', error);
      res.status(500).json({ error: 'Failed to delete project note' });
    }
  }
}; 

/**
 * Get project images
 * @route GET /api/projects/:id/images
 */
export const getProjectImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if user has access to this project
    if (req.user?.role !== 'ADMIN') {
      const isMember = project.members.some((member: any) => 
        member.userId === req.user?.id
      );
      if (!isMember) {
        throw new ApiError(403, 'You do not have access to this project');
      }
    }
    
    // For now, this is a placeholder that returns an empty array
    // In a real implementation, you would fetch images from your database or file storage
    const images: Array<{
      id: string;
      name: string;
      url: string;
      projectId: string;
      userId?: string;
      createdAt: string;
    }> = [];
    
    res.status(200).json(images);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get project images error:', error);
      res.status(500).json({ error: 'Failed to fetch project images' });
    }
  }
};

/**
 * Upload project images
 * @route POST /api/projects/:id/images
 */
export const uploadProjectImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if user has access to this project
    if (req.user?.role !== 'ADMIN') {
      const isMember = project.members.some((member: any) => 
        member.userId === req.user?.id
      );
      if (!isMember) {
        throw new ApiError(403, 'You do not have access to this project');
      }
    }
    
    // Check if files were uploaded
    const files = req.files as any[] | undefined;
    if (!files || files.length === 0) {
      throw new ApiError(400, 'No files were uploaded');
    }
    
    // For now, this is a placeholder that simulates successful upload
    // In a real implementation, you would save the files and update your database
    const uploadedImages = files.map(file => ({
      id: `img-${Date.now()}`,
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      projectId: id,
      userId: req.user?.id,
      createdAt: new Date().toISOString()
    }));
    
    res.status(201).json(uploadedImages);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Upload project images error:', error);
      res.status(500).json({ error: 'Failed to upload images' });
    }
  }
};

/**
 * Delete project image
 * @route DELETE /api/projects/:id/images/:imageId
 */
export const deleteProjectImage = async (req: Request, res: Response) => {
  try {
    const { id, imageId } = req.params;
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if user has access to this project
    if (req.user?.role !== 'ADMIN') {
      const isMember = project.members.some((member: any) => 
        member.userId === req.user?.id
      );
      if (!isMember) {
        throw new ApiError(403, 'You do not have access to this project');
      }
    }
    
    // For now, this is a placeholder that simulates successful deletion
    // In a real implementation, you would delete the file and update your database
    
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Delete project image error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }
}; 

/**
 * Get project comments
 * @route GET /api/projects/:id/comments
 */
export const getProjectComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const comments = await prisma.comment.findMany({
      where: { projectId: id },
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
    });
    
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching project comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create project comment
 * @route POST /api/projects/:id/comments
 */
export const createProjectComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        projectId: id,
        userId: req.user!.id
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
    
    // Log activity
    await logActivity({
      userId: req.user!.id,
      action: 'COMMENT_CREATED',
      objectType: 'PROJECT',
      objectId: id,
      description: `Added comment to project`
    });
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating project comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete project comment
 * @route DELETE /api/projects/:id/comments/:commentId
 */
export const deleteProjectComment = async (req: Request, res: Response) => {
  try {
    const { id, commentId } = req.params;
    
    // Check if comment exists and user has permission to delete
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { project: true }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Only comment author or project admin can delete
    if (comment.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    await prisma.comment.delete({
      where: { id: commentId }
    });
    
    // Log activity
    await logActivity({
      userId: req.user!.id,
      action: 'COMMENT_DELETED',
      objectType: 'PROJECT',
      objectId: id,
      description: `Deleted comment from project`
    });
    
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting project comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 

/**
 * Get project statistics
 * @route GET /api/projects/:id/stats
 */
export const getProjectStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get project
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      throw new ApiError(404, 'Dự án không tồn tại');
    }

    // Get counts
    const [taskCount, documentCount, memberCount, containerCount, noteCount, commentCount] = await Promise.all([
      prisma.task.count({ where: { projectId: id } }),
      prisma.document.count({ where: { projectId: id } }),
      prisma.projectMember.count({ where: { projectId: id } }),
      prisma.container.count({ where: { projectId: id } }),
      prisma.projectNote.count({ where: { projectId: id } }),
      prisma.comment.count({ where: { projectId: id } })
    ]);

    // Get task statistics
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId: id },
      _count: { status: true }
    });

    const completedTasks = taskStats.find(stat => stat.status === 'COMPLETED')?._count.status || 0;
    const totalTasks = taskCount;

    // Get recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: { objectType: 'project', objectId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Get project timeline
    const timeline = await prisma.activityLog.findMany({
      where: { objectType: 'project', objectId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        action: true,
        createdAt: true,
        description: true
      }
    });

    res.status(200).json({
      projectId: id,
      totalTasks,
      completedTasks,
      totalDocuments: documentCount,
      totalMembers: memberCount,
      totalContainers: containerCount,
      totalNotes: noteCount,
      totalComments: commentCount,
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      recentActivity,
      timeline
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Error getting project stats:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
};

/**
 * Export project data
 * @route GET /api/projects/:id/export
 */
export const exportProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { format = 'xlsx' } = req.query;

    // Get project with all related data
    const [project, members, tasks, documents, containers, notes, comments] = await Promise.all([
      prisma.project.findUnique({ where: { id } }),
      prisma.projectMember.findMany({
        where: { projectId: id },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }),
      prisma.task.findMany({
        where: { projectId: id },
        include: {
          assignee: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.document.findMany({ where: { projectId: id } }),
      prisma.container.findMany({ where: { projectId: id } }),
      prisma.projectNote.findMany({
        where: { projectId: id },
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.comment.findMany({
        where: { projectId: id },
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      })
    ]);

    if (!project) {
      throw new ApiError(404, 'Dự án không tồn tại');
    }

    // Log export activity
    await logActivity({
      userId: req.user?.id!,
      action: 'EXPORT_PROJECT',
      objectType: 'project',
      objectId: id,
      description: `Xuất dự án ${project.name} định dạng ${format}`
    });

    // Prepare data for export
    const exportData = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate,
        endDate: project.endDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      members: members.map(member => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.user.role,
        projectRole: member.role,
        joinedAt: member.joinedAt
      })),
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignee?.name || 'Chưa phân công',
        dueDate: task.dueDate,
        createdAt: task.createdAt
      })),
      documents: documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        url: doc.fileUrl,
        type: doc.fileType,
        size: doc.fileSize,
        uploadedBy: doc.uploaderId,
        createdAt: doc.createdAt
      })),
      containers: containers.map(container => ({
        id: container.id,
        name: container.name,
        code: container.code,
        status: container.status,
        createdAt: container.createdAt
      })),
      notes: notes.map(note => ({
        id: note.id,
        content: note.content,
        author: note.user.name,
        createdAt: note.createdAt
      })),
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        author: comment.user?.name || 'Unknown',
        createdAt: comment.createdAt
      }))
    };

    // Generate export based on format
    let fileName = `${project.name}_export_${new Date().toISOString().split('T')[0]}`;
    let contentType = 'application/json';
    let data = JSON.stringify(exportData, null, 2);

    if (format === 'xlsx') {
      // For now, return JSON. In production, you'd use a library like exceljs
      fileName += '.json';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(data);
    } else if (format === 'pdf') {
      // For now, return JSON. In production, you'd use a library like puppeteer
      fileName += '.json';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(data);
    } else if (format === 'docx') {
      // For now, return JSON. In production, you'd use a library like docx
      fileName += '.json';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(data);
    } else {
      fileName += '.json';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(data);
    }

  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Error exporting project:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
};

/**
 * Share project
 * @route POST /api/projects/:id/share
 */
export const shareProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, message } = req.body;

    // Validate email
    if (!email || !email.includes('@')) {
      throw new ApiError(400, 'Email không hợp lệ');
    }

    // Get project
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, name: true, description: true }
    });

    if (!project) {
      throw new ApiError(404, 'Dự án không tồn tại');
    }

    // Check if user has permission to share
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: req.user?.id
      }
    });

    if (!projectMember && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Không có quyền chia sẻ dự án này');
    }

    // Create share record - for now, just return success
    // In production, you would create a share record in the database
    const shareRecord = {
      id: 'temp-share-id',
      projectId: id,
      sharedBy: req.user?.id!,
      sharedWith: email,
      message: message || '',
      status: 'PENDING'
    };

    // Log share activity
    await logActivity({
      userId: req.user?.id!,
      action: 'SHARE_PROJECT',
      objectType: 'project',
      objectId: id,
      description: `Chia sẻ dự án ${project.name} với ${email}`
    });

    // In production, you would send an email here
    // For now, we'll just return success
    res.status(200).json({
      message: 'Dự án đã được chia sẻ thành công',
      shareId: shareRecord.id,
      sharedWith: email
    });

  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Error sharing project:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
};

/**
 * Get project shares
 * @route GET /api/projects/:id/shares
 */
export const getProjectShares = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // For now, return empty shares array
    // In production, you would query the ProjectShare table
    res.status(200).json({ shares: [] });
  } catch (error) {
    console.error('Error getting project shares:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

/**
 * Revoke project share
 * @route DELETE /api/projects/:id/shares/:shareId
 */
export const revokeProjectShare = async (req: Request, res: Response) => {
  try {
    const { id, shareId } = req.params;

    // For now, just return success
    // In production, you would delete from ProjectShare table

    // Log revoke activity
    await logActivity({
      userId: req.user?.id!,
      action: 'REVOKE_SHARE',
      objectType: 'project',
      objectId: id,
      description: `Thu hồi chia sẻ dự án`
    });

    res.status(200).json({ message: 'Đã thu hồi chia sẻ thành công' });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Error revoking project share:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
}; 