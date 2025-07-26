import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

// Lấy danh sách issue (có filter, phân trang)
export const getIssues = async (req: Request, res: Response) => {
  try {
    const { projectId, status, priority, type, search, page = 1, limit = 20 } = req.query;
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          project: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } }
        }
      }),
      prisma.issue.count({ where })
    ]);
    res.json({ issues, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
};

// Lấy chi tiết issue
export const getIssueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } }
      }
    });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
};

// Tạo mới issue
export const createIssue = async (req: Request, res: Response) => {
  try {
    const { code, title, description, type, status, priority, projectId, assigneeId } = req.body;
    const createdById = req.user?.id;
    if (!title || !type || !status || !priority || !projectId) {
      throw new ApiError(400, 'Missing required fields');
    }
    const issue = await prisma.issue.create({
      data: {
        code,
        title,
        description,
        type,
        status,
        priority,
        projectId,
        createdById,
        assigneeId
      }
    });
    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create issue' });
  }
};

// Cập nhật issue
export const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, type, status, priority, assigneeId } = req.body;
    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) throw new ApiError(404, 'Issue not found');
    // Phân quyền: chỉ ADMIN, PROJECT_MANAGER, BIM_MANAGER, người tạo hoặc assignee được sửa
    if (
      req.user?.role !== 'ADMIN' &&
      req.user?.role !== 'PROJECT_MANAGER' &&
      req.user?.role !== 'BIM_MANAGER' &&
      req.user?.id !== issue.createdById &&
      req.user?.id !== issue.assigneeId
    ) {
      throw new ApiError(403, 'No permission to update this issue');
    }
    const updated = await prisma.issue.update({
      where: { id },
      data: { title, description, type, status, priority, assigneeId }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update issue' });
  }
};

// Xoá issue
export const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) throw new ApiError(404, 'Issue not found');
    // Phân quyền: chỉ ADMIN, PROJECT_MANAGER, BIM_MANAGER, người tạo hoặc assignee được xoá
    if (
      req.user?.role !== 'ADMIN' &&
      req.user?.role !== 'PROJECT_MANAGER' &&
      req.user?.role !== 'BIM_MANAGER' &&
      req.user?.id !== issue.createdById &&
      req.user?.id !== issue.assigneeId
    ) {
      throw new ApiError(403, 'No permission to delete this issue');
    }
    await prisma.issue.delete({ where: { id } });
    res.json({ message: 'Issue deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete issue' });
  }
}; 