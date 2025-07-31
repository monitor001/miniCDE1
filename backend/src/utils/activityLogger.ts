import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ActivityLogData {
  userId: string;
  action: string;
  objectType: string;
  objectId: string;
  description?: string;
  relatedUserIds?: string[]; // Thêm mảng user liên quan
  notify?: boolean; // Thêm tuỳ chọn notify
}

export const logActivity = async (data: ActivityLogData) => {
  try {
    const activity = await prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        objectType: data.objectType,
        objectId: data.objectId,
        description: data.description
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

    // Chỉ emit socket event nếu notify=true
    if (data.notify && global.io) {
      const userIds = Array.from(new Set([
        data.userId,
        ...(data.relatedUserIds || [])
      ])).filter(Boolean);
      userIds.forEach(uid => {
        global.io.to(`user:${uid}`).emit('activity:new', {
          id: activity.id,
          action: activity.action,
          objectType: activity.objectType,
          objectId: activity.objectId,
          description: activity.description,
          user: activity.user,
          createdAt: activity.createdAt
        });
      });
    }

    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
};

export const getActivityLogs = async (options: {
  page?: number;
  limit?: number;
  userId?: string;
  objectType?: string;
  objectId?: string;
  action?: string;
}) => {
  const { page = 1, limit = 20, userId, objectType, objectId, action } = options;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (userId) where.userId = userId;
  if (objectType) where.objectType = objectType;
  if (objectId) where.objectId = objectId;
  if (action) where.action = action;

  // TODO: Uncomment when ActivityLog model is properly generated
  /*
  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.activityLog.count({ where })
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
  */
  
  // Return empty data for now
  return {
    logs: [],
    pagination: {
      total: 0,
      page,
      limit,
      pages: 0
    }
  };
}; 