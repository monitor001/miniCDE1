import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../middlewares/errorHandler';
import { ProjectMemberWithUser, Member } from '../types/global';

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
    
    // Get projects with pagination
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
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
          },
          _count: {
            select: {
              documents: true,
              tasks: true,
              containers: true
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
    
    console.log('Getting project details for ID:', id);
    console.log('User:', req.user);
    
    const project = await prisma.project.findUnique({
      where: { id },
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
        },
        containers: true,
        documents: true,
        tasks: true,
        _count: {
          select: {
            documents: true,
            tasks: true,
            containers: true
          }
        }
      }
    });
    
    console.log('Found project:', project ? 'yes' : 'no');
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if user has access to this project
    if (req.user?.role !== 'ADMIN') {
      const isMember = project.members.some((member: ProjectMemberWithUser) => member.user.id === req.user?.id);
      if (!isMember) {
        throw new ApiError(403, 'You do not have access to this project');
      }
    }
    
    // Ensure all dates are properly formatted
    const formattedProject = {
      ...project,
      startDate: project.startDate ? project.startDate.toISOString() : null,
      endDate: project.endDate ? project.endDate.toISOString() : null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    };
    
    console.log('Sending project details:', {
      id: formattedProject.id,
      name: formattedProject.name,
      startDate: formattedProject.startDate,
      endDate: formattedProject.endDate
    });
    
    res.status(200).json(formattedProject);
  } catch (error) {
    console.error('Get project by ID error:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
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
    const { name, description, status, startDate, endDate, priority, memberIds } = req.body;
    
    // Validate input
    if (!name || !status) {
      throw new ApiError(400, 'Name and status are required');
    }
    if (typeof name !== 'string' || name.trim().length < 3) {
      throw new ApiError(400, 'Tên dự án phải có ít nhất 3 ký tự');
    }
    
    // Log thông tin tạo dự án
    console.log('Creating project with data:', {
      name,
      description: description || null,
      status,
      startDate: startDate || null,
      endDate: endDate || null,
      priority: priority || null,
      memberIds: memberIds || []
    });
    
    // Create project with current user as a member
    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority: priority || null,
        members: {
          create: [
            {
              userId: req.user?.id as string,
              role: (req.user?.role || 'PROJECT_MANAGER') as any
            },
            // Add other members if provided
            ...(memberIds && Array.isArray(memberIds) ? memberIds.map((memberId: string) => ({
              userId: memberId,
              role: 'MEMBER' as any
            })) : [])
          ]
        }
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
    
    // Create default containers according to ISO 19650
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
    
    // Notify project creation via Socket.IO
    global.io.emit('project:created', {
      id: project.id,
      name: project.name,
      createdBy: req.user?.id
    });
    
  res.status(201).json(project);
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
    const { name, description, status, startDate, endDate, priority } = req.body;
    
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
    
    console.log('Deleting project with ID:', id);
    console.log('User:', req.user);
    
    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    console.log('Found project:', existingProject ? 'yes' : 'no');
    
    if (!existingProject) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Check if user has permission to delete the project
    if (req.user?.role !== 'ADMIN') {
      const userMembership = existingProject.members.find((member: Member) => member.userId === req.user?.id);
      
      console.log('User membership:', userMembership);
      
      if (!userMembership || userMembership.role !== 'PROJECT_MANAGER') {
        throw new ApiError(403, 'You do not have permission to delete this project');
      }
    }
    
    // Delete related records first to avoid foreign key constraint errors
    console.log('Deleting related records for project:', id);
    
    // Get all tasks for this project
    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      select: { id: true }
    });
    
    const taskIds = tasks.map(task => task.id);
    
    // Delete task history records
    if (taskIds.length > 0) {
      await prisma.taskHistory.deleteMany({
        where: { taskId: { in: taskIds } }
      });
      
      // Delete comments
      await prisma.comment.deleteMany({
        where: { taskId: { in: taskIds } }
      });
      
      // Delete task-document relationships
      await prisma.taskDocument.deleteMany({
        where: { taskId: { in: taskIds } }
      });
    }
    
    // Delete documents
    await prisma.documentHistory.deleteMany({
      where: { document: { projectId: id } }
    });
    
    await prisma.document.deleteMany({
      where: { projectId: id }
    });
    
    // Delete tasks
    await prisma.task.deleteMany({
      where: { projectId: id }
    });
    
    // Delete containers
    await prisma.container.deleteMany({
      where: { projectId: id }
    });
    
    // Delete project members
    await prisma.projectMember.deleteMany({
      where: { projectId: id }
    });
    
    // Finally delete the project
    console.log('Deleting project itself:', id);
    await prisma.project.delete({
      where: { id }
    });
    
    // Notify project deletion via Socket.IO
    global.io.emit('project:deleted', {
      id,
      name: existingProject.name,
      deletedBy: req.user?.id
    });
    
    console.log('Project deleted successfully:', id);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete project' });
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
      const isMember = project.members.some((member) => 
        member.userId === req.user?.id
      );
      if (!isMember) {
        throw new ApiError(403, 'You do not have access to this project');
      }
    }
    
    // Get notes with user details
    const notes = await prisma.$queryRaw`
      SELECT 
        pn.id, 
        pn.content, 
        pn."projectId", 
        pn."userId", 
        pn."createdAt", 
        pn."updatedAt",
        u.name as "userName", 
        u.email as "userEmail",
        u.id as "userId"
      FROM "ProjectNote" pn
      JOIN "User" u ON u.id = pn."userId"
      WHERE pn."projectId" = ${id}
      ORDER BY pn."createdAt" DESC
    `;
    
    // Format the notes for the response
    const formattedNotes = Array.isArray(notes) ? notes.map((note: any) => ({
      id: note.id,
      content: note.content,
      projectId: note.projectId,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      user: {
        id: note.userId,
        name: note.userName,
        email: note.userEmail
      }
    })) : [];
    
    res.status(200).json(formattedNotes);
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
    const { content } = req.body;
    
    console.log('Creating note for project:', id);
    console.log('Note content:', content);
    console.log('User:', req.user);
    
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
      const isMember = project.members.some((member) => 
        member.userId === req.user?.id
      );
      if (!isMember) {
        throw new ApiError(403, 'You do not have access to this project');
      }
    }
    
    // Create note using raw SQL since the ProjectNote model might not be generated yet
    const note = await prisma.$executeRaw`
      INSERT INTO "ProjectNote" (id, content, "projectId", "userId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${content}, ${id}, ${req.user?.id}, now(), now())
      RETURNING id, content, "projectId", "userId", "createdAt", "updatedAt"
    `;
    
    // Get the created note with user details
    const createdNote = await prisma.$queryRaw`
      SELECT 
        pn.id, 
        pn.content, 
        pn."projectId", 
        pn."userId", 
        pn."createdAt", 
        pn."updatedAt",
        u.name as "userName", 
        u.email as "userEmail"
      FROM "ProjectNote" pn
      JOIN "User" u ON u.id = pn."userId"
      WHERE pn."projectId" = ${id}
      ORDER BY pn."createdAt" DESC
      LIMIT 1
    `;
    
    const noteData = Array.isArray(createdNote) && createdNote.length > 0 ? {
      id: createdNote[0].id,
      content: createdNote[0].content,
      projectId: createdNote[0].projectId,
      createdAt: createdNote[0].createdAt,
      updatedAt: createdNote[0].updatedAt,
      user: {
        id: createdNote[0].userId,
        name: createdNote[0].userName,
        email: createdNote[0].userEmail
      }
    } : {
      content,
      projectId: id,
      userId: req.user?.id,
      createdAt: new Date(),
      user: {
        id: req.user?.id,
        name: req.user ? (req.user as any).name || 'Unknown' : 'Unknown',
        email: req.user ? req.user.email || 'unknown@example.com' : 'unknown@example.com'
      }
    };
    
    // Notify note creation via Socket.IO
    global.io.to(`project:${id}`).emit('project:note:created', {
      projectId: id,
      note: noteData,
      createdBy: req.user?.id
    });
    
    res.status(201).json(noteData);
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
    
    // Check if note exists using raw query
    const note = await prisma.$queryRaw`
      SELECT * FROM "ProjectNote" WHERE id = ${noteId} AND "projectId" = ${id}
    `;
    
    if (!Array.isArray(note) || note.length === 0) {
      throw new ApiError(404, 'Note not found in this project');
    }
    
    // Check if user has permission (admin, project manager, or note creator)
    const hasPermission = 
      req.user?.role === 'ADMIN' ||
      project.members.some((member) => 
        member.userId === req.user?.id && 
        ['PROJECT_MANAGER', 'BIM_MANAGER'].includes(member.role)
      ) ||
      note[0].userId === req.user?.id;
    
    if (!hasPermission) {
      throw new ApiError(403, 'You do not have permission to delete this note');
    }
    
    // Delete note using raw SQL
    await prisma.$executeRaw`DELETE FROM "ProjectNote" WHERE id = ${noteId}`;
    
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
      const isMember = project.members.some((member) => 
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
      const isMember = project.members.some((member) => 
        member.userId === req.user?.id
      );
      if (!isMember) {
        throw new ApiError(403, 'You do not have access to this project');
      }
    }
    
    // Check if files were uploaded
    const files = req.files as Express.Multer.File[] | undefined;
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
      const isMember = project.members.some((member) => 
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