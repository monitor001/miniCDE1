import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ApiError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

/**
 * Get all users (with filtering and pagination)
 * @route GET /api/users
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    // Only admins can see all users
    if (req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden: Only admins can access user list');
    }
    
    const { 
      search, 
      role, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter conditions
    const where: any = {};
    
    // Filter by role
    if (role) {
      where.role = role;
    }
    
    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organization: true,
          createdAt: true,
          updatedAt: true,
          twoFactorSecret: true,
          _count: {
            select: {
              projects: true,
              documents: true,
              tasks: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.user.count({ where })
    ]);
    
    // Transform users to hide sensitive info
    const transformedUsers = users.map(user => ({
      ...user,
      twoFactorEnabled: !!user.twoFactorSecret,
      twoFactorSecret: undefined
    }));
    
    res.status(200).json({
      users: transformedUsers,
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
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
};

/**
 * Get users for task assignment (project members can see users in their projects)
 * @route GET /api/users/assignable
 */
export const getAssignableUsers = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    
    if (!projectId) {
      throw new ApiError(400, 'Project ID is required');
    }
    
    // Check if user has access to this project
    if (req.user?.role !== 'ADMIN') {
      const projectMembership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: req.user?.id as string,
            projectId: projectId as string
          }
        }
      });
      
      if (!projectMembership) {
        throw new ApiError(403, 'You do not have access to this project');
      }
    }
    
    // Get all users who are members of this project
    const projectMembers = await prisma.projectMember.findMany({
      where: {
        projectId: projectId as string
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
    
    const users = projectMembers.map(member => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.user.role,
      projectRole: member.role
    }));
    
    res.status(200).json(users);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get assignable users error:', error);
      res.status(500).json({ error: 'Failed to fetch assignable users' });
    }
  }
};

/**
 * Test endpoint - no authentication required
 * @route GET /api/users/test
 */
export const testUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      take: 5
    });
    
    res.status(200).json({
      message: 'Test endpoint working',
      users: users
    });
  } catch (error) {
    console.error('Test users error:', error);
    res.status(500).json({ error: 'Failed to fetch test users' });
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Users can only see their own profile unless they're admins
    if (req.user?.role !== 'ADMIN' && req.user?.id !== id) {
      throw new ApiError(403, 'Forbidden: You can only view your own profile');
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        createdAt: true,
        updatedAt: true,
        twoFactorSecret: true,
        projects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        },
        _count: {
          select: {
            documents: true,
            tasks: true
          }
        }
      }
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Transform user to hide sensitive info
    const transformedUser = {
      ...user,
      twoFactorEnabled: !!user.twoFactorSecret,
      twoFactorSecret: undefined
    };
    
    res.status(200).json(transformedUser);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get user by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
};

/**
 * Create user (admin only)
 * @route POST /api/users
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    // Only admins can create users
    if (req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden: Only admins can create users');
    }
    
    const { email, password, name, role, organization } = req.body;
    
    // Validate input
    if (!email || !password || !name || !role) {
      throw new ApiError(400, 'Email, password, name, and role are required');
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        organization
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, organization, password } = req.body;
    
    // Users can only update their own profile unless they're admins
    if (req.user?.role !== 'ADMIN' && req.user?.id !== id) {
      throw new ApiError(403, 'Forbidden: You can only update your own profile');
    }
    
    // Only admins can update roles
    if (role && req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden: Only admins can update roles');
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (organization) updateData.organization = organization;
    if (role && req.user?.role === 'ADMIN') updateData.role = role;
    
    // Hash password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
};

/**
 * Delete user (admin only)
 * @route DELETE /api/users/:id
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Only admins can delete users
    if (req.user?.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden: Only admins can delete users');
    }
    
    // Prevent deleting yourself
    if (req.user?.id === id) {
      throw new ApiError(400, 'You cannot delete your own account');
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
            documents: true,
            tasks: true
          }
        }
      }
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Check if user has associated data
    if (user._count.projects > 0 || user._count.documents > 0 || user._count.tasks > 0) {
      throw new ApiError(400, 'Cannot delete user with associated data. Reassign or delete their data first.');
    }
    
    // Delete user
    await prisma.user.delete({
      where: { id }
    });
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
};

/**
 * Get user projects
 * @route GET /api/users/:id/projects
 */
export const getUserProjects = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Users can only see their own projects unless they're admins
    if (req.user?.role !== 'ADMIN' && req.user?.id !== id) {
      throw new ApiError(403, 'Forbidden: You can only view your own projects');
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Get user projects
    const projects = await prisma.projectMember.findMany({
      where: { userId: id },
      include: {
        project: {
          include: {
            _count: {
              select: {
                documents: true,
                tasks: true,
                members: true
              }
            }
          }
        }
      },
      orderBy: { project: { updatedAt: 'desc' } }
    });
    
    res.status(200).json(projects);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get user projects error:', error);
      res.status(500).json({ error: 'Failed to fetch user projects' });
    }
  }
};

/**
 * Get user tasks
 * @route GET /api/users/:id/tasks
 */
export const getUserTasks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    
    // Users can only see their own tasks unless they're admins
    if (req.user?.role !== 'ADMIN' && req.user?.id !== id) {
      throw new ApiError(403, 'Forbidden: You can only view your own tasks');
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Build filter conditions
    const where: any = { assigneeId: id };
    
    // Filter by status
    if (status) {
      where.status = status;
    }
    
    // Get user tasks
    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
    
    res.status(200).json(tasks);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get user tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch user tasks' });
    }
  }
}; 