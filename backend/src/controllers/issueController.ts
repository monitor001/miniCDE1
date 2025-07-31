import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../middlewares/errorHandler';
import path from 'path';
import fs from 'fs';
import { logActivity } from '../utils/activityLogger';

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
    
    // Tự động tạo code nếu không có
    let issueCode = code;
    if (!issueCode) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      issueCode = `ISSUE-${timestamp}-${random}`;
    }
    
    const issue = await prisma.issue.create({
      data: {
        code: issueCode,
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
    // Ghi log audit trail
    if (createdById) {
      await logActivity({
        userId: createdById,
        action: 'create',
        objectType: 'issue',
        objectId: issue.id,
        description: `Tạo vấn đề mới: "${title}"`,
        notify: true
      });
    }
    res.status(201).json(issue);
  } catch (error) {
    console.error('Error in createIssue:', error);
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
    // Ghi log audit trail
    if (req.user?.id) {
      await logActivity({
        userId: req.user.id,
        action: 'update',
        objectType: 'issue',
        objectId: id,
        description: `Cập nhật vấn đề: "${title}"`,
        notify: true
      });
    }
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
    // Ghi log audit trail
    if (req.user?.id) {
      await logActivity({
        userId: req.user.id,
        action: 'delete',
        objectType: 'issue',
        objectId: id,
        description: `Xoá vấn đề: "${issue.title}"`,
        notify: true
      });
    }
    res.json({ message: 'Issue deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete issue' });
  }
};

// Lấy danh sách comment của issue
export const getIssueComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: { issueId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Tạo comment cho issue (hỗ trợ upload file nhỏ)
export const createIssueComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    type Attachment = { originalname: string; filename: string; mimetype: string; size: number; url: string };
    let attachments: Attachment[] | undefined = undefined;
    if (req.files && Array.isArray(req.files)) {
      attachments = req.files.map((file: any) => ({
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`
      }));
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized: missing user id' });
    }
    const comment = await prisma.comment.create({
      data: {
        content,
        issueId: id,
        userId: req.user.id,
        attachments: attachments ? attachments : undefined
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    // Ghi log audit trail
    await logActivity({
      userId: req.user.id,
      action: 'comment',
      objectType: 'issue',
      objectId: id,
      description: `Thêm bình luận cho vấn đề: ${content?.slice(0, 100)}`,
      notify: true
    });
    // Phát socket cho realtime
    // Lấy issue để lấy projectId (nếu có)
    const issue = await prisma.issue.findUnique({ where: { id }, select: { projectId: true } });
    if (global.io) {
      if (issue?.projectId) {
        global.io.to(`project:${issue.projectId}`).emit('issue:comment:created', { issueId: id, comment });
      } else {
        global.io.emit('issue:comment:created', { issueId: id, comment });
      }
    }
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
}; 