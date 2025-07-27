import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logActivity } from '../utils/activityLogger';

const prisma = new PrismaClient();

// Lấy danh sách báo cáo
export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Tạo báo cáo mới
export const createReport = async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }

    const report = await prisma.report.create({
      data: {
        title: type,
        type,
        data: typeof data === 'string' ? JSON.parse(data) : data,
        createdById: req.user?.id
      }
    });

    // Ghi log audit trail
    if (req.user?.id) {
      await logActivity({
        userId: req.user.id,
        action: 'create',
        objectType: 'report',
        objectId: report.id,
        description: `Tạo báo cáo "${type}"`
      });
    }

    res.status(201).json(report);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

// Lấy thống kê
export const getStats = async (req: Request, res: Response) => {
  try {
    console.log('GET /api/reports/stats called');
    const [taskCount, documentCount, userCount, projectCount, issueCount] = await Promise.all([
      prisma.task.count(),
      prisma.document.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.issue.count(),
    ]);
    res.json({ taskCount, documentCount, userCount, projectCount, issueCount });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}; 