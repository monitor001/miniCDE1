import { Request, Response } from 'express';
import { getActivityLogs } from '../utils/activityLogger';
import { ApiError } from '../middlewares/errorHandler';

/**
 * Get activity logs
 * @route GET /api/activities
 */
export const getActivities = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      userId, 
      objectType, 
      objectId, 
      action 
    } = req.query;

    const result = await getActivityLogs({
      page: Number(page),
      limit: Number(limit),
      userId: userId as string,
      objectType: objectType as string,
      objectId: objectId as string,
      action: action as string
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
}; 