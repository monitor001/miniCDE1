import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStats = async (req: Request, res: Response) => {
  console.log('GET /api/reports/stats called');
  const [taskCount, documentCount, userCount] = await Promise.all([
    prisma.task.count(),
    prisma.document.count(),
    prisma.user.count(),
  ]);
  res.json({ taskCount, documentCount, userCount });
}; 