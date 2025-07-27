import { Router } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Dashboard statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [
      totalProjects,
      totalTasks,
      totalDocuments,
      totalUsers,
      pendingApprovals,
      completedApprovals,
      rejectedApprovals,
      overdueTasks,
      recentActivities
    ] = await Promise.all([
      prisma.project.count(),
      prisma.task.count(),
      prisma.document.count(),
      prisma.user.count(),
      prisma.document.count({ where: { status: 'WORK_IN_PROGRESS' } }),
      prisma.document.count({ where: { status: 'PUBLISHED' } }),
      prisma.document.count({ where: { status: 'ARCHIVED' } }),
      prisma.task.count({ 
        where: { 
          dueDate: { lt: new Date() },
          status: { not: 'COMPLETED' }
        } 
      }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      })
    ]);

    res.json({
      stats: {
        totalProjects,
        totalTasks,
        totalDocuments,
        totalUsers,
        pendingApprovals,
        completedApprovals,
        rejectedApprovals,
        overdueTasks
      },
      recentActivities
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Tasks by project with priority breakdown (only unfinished tasks)
router.get('/tasks-by-project', authMiddleware, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          where: {
            status: { not: 'COMPLETED' }
          },
          select: {
            priority: true
          }
        }
      }
    });

    const priorities = ['HIGH', 'MEDIUM', 'LOW', 'NONE'];
    const taskData = projects.map(project => {
      // Map priority, if null/undefined then 'NONE'
      const counts: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };
      project.tasks.forEach(t => {
        const p = t.priority ? t.priority : 'NONE';
        if (counts[p] !== undefined) counts[p]++;
        else counts['NONE']++;
      });
      return {
        projectName: project.name,
        high: counts.HIGH,
        medium: counts.MEDIUM,
        low: counts.LOW,
        none: counts.NONE
      };
    });

    res.json(taskData);
  } catch (error) {
    console.error('Tasks by project error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks by project' });
  }
});

// Issues by project with priority breakdown (only unfinished issues)
router.get('/issues-by-project', authMiddleware, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        issues: {
          where: {
            status: { notIn: ['RESOLVED', 'CLOSED'] }
          },
          select: {
            priority: true
          }
        }
      }
    });

    const priorities = ['HIGH', 'MEDIUM', 'LOW', 'NONE'];
    const issueData = projects.map(project => {
      const counts: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };
      project.issues.forEach(i => {
        const p = i.priority ? i.priority : 'NONE';
        if (counts[p] !== undefined) counts[p]++;
        else counts['NONE']++;
      });
      return {
        projectName: project.name,
        high: counts.HIGH,
        medium: counts.MEDIUM,
        low: counts.LOW,
        none: counts.NONE
      };
    });

    res.json(issueData);
  } catch (error) {
    console.error('Issues by project error:', error);
    res.status(500).json({ error: 'Failed to fetch issues by project' });
  }
});

// Documents by project with status breakdown
router.get('/documents-by-project', authMiddleware, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        documents: {
          select: {
            status: true
          }
        }
      }
    });

    const documentData = projects.map(project => {
      const documents = project.documents;
      return {
        projectName: project.name,
        published: documents.filter(d => d.status === 'PUBLISHED').length,
        shared: documents.filter(d => d.status === 'SHARED').length,
        wip: documents.filter(d => d.status === 'WORK_IN_PROGRESS').length,
        archived: documents.filter(d => d.status === 'ARCHIVED').length
      };
    });

    res.json(documentData);
  } catch (error) {
    console.error('Documents by project error:', error);
    res.status(500).json({ error: 'Failed to fetch documents by project' });
  }
});

// Events by project for today
router.get('/events-by-project', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const projects = await prisma.project.findMany({
      include: {
        calendarEvents: {
          where: {
            startDate: {
              gte: startOfDay,
              lt: endOfDay
            }
          },
          select: {
            id: true
          }
        }
      }
    });

    const eventData = projects.map(project => ({
      projectName: project.name,
      todayEvents: project.calendarEvents.length
    }));

    res.json(eventData);
  } catch (error) {
    console.error('Events by project error:', error);
    res.status(500).json({ error: 'Failed to fetch events by project' });
  }
});

// Project status distribution
router.get('/project-status', authMiddleware, async (req, res) => {
  try {
    const projects = await prisma.project.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const statusData = projects.map(p => ({
      status: p.status,
      count: p._count.status
    }));

    res.json({ statusData });
  } catch (error) {
    console.error('Project status error:', error);
    res.status(500).json({ error: 'Failed to fetch project status' });
  }
});

// Task progress by priority
router.get('/task-priority', authMiddleware, async (req, res) => {
  try {
    const tasks = await prisma.task.groupBy({
      by: ['priority'],
      _count: { priority: true }
    });

    const priorityData = tasks.map(t => ({
      priority: t.priority,
      count: t._count.priority
    }));

    res.json({ priorityData });
  } catch (error) {
    console.error('Task priority error:', error);
    res.status(500).json({ error: 'Failed to fetch task priority' });
  }
});

// Document status distribution
router.get('/document-status', authMiddleware, async (req, res) => {
  try {
    const documents = await prisma.document.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const statusData = documents.map(d => ({
      status: d.status,
      count: d._count.status
    }));

    res.json({ statusData });
  } catch (error) {
    console.error('Document status error:', error);
    res.status(500).json({ error: 'Failed to fetch document status' });
  }
});

// Monthly activity trends
router.get('/activity-trends', authMiddleware, async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const activities = await prisma.activityLog.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo }
      },
      select: {
        createdAt: true,
        action: true
      }
    });

    // Group by month
    const monthlyData = activities.reduce((acc: any, activity) => {
      const month = new Date(activity.createdAt).toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    res.json({ monthlyData });
  } catch (error) {
    console.error('Activity trends error:', error);
    res.status(500).json({ error: 'Failed to fetch activity trends' });
  }
});

// Recent projects with progress
router.get('/recent-projects', authMiddleware, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        tasks: {
          select: {
            status: true
          }
        }
      }
    });

    const projectsWithProgress = projects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        progress,
        totalTasks,
        completedTasks,
        updatedAt: project.updatedAt
      };
    });

    res.json({ projects: projectsWithProgress });
  } catch (error) {
    console.error('Recent projects error:', error);
    res.status(500).json({ error: 'Failed to fetch recent projects' });
  }
});

// Calendar events for today
router.get('/today-events', authMiddleware, async (req, res) => {
  try {
    // Lấy thời gian hiện tại theo Asia/Ho_Chi_Minh
    const now = new Date();
    const tzOffset = 7 * 60; // UTC+7
    const local = new Date(now.getTime() + (tzOffset - now.getTimezoneOffset()) * 60000);
    const startOfDay = new Date(local.getFullYear(), local.getMonth(), local.getDate());
    const endOfDay = new Date(local.getFullYear(), local.getMonth(), local.getDate() + 1);
    // Chuyển về UTC để so sánh với dữ liệu trong DB
    const startUTC = new Date(startOfDay.getTime() - tzOffset * 60000);
    const endUTC = new Date(endOfDay.getTime() - tzOffset * 60000);

    const events = await prisma.calendarEvent.findMany({
      where: {
        startDate: {
          gte: startUTC,
          lt: endUTC
        }
      },
      include: {
        attendees: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    res.json({ events });
  } catch (error) {
    console.error('Today events error:', error);
    res.status(500).json({ error: 'Failed to fetch today events' });
  }
});

// Issues summary
router.get('/issues-summary', authMiddleware, async (req, res) => {
  try {
    const [
      totalIssues,
      openIssues,
      resolvedIssues,
      criticalIssues
    ] = await Promise.all([
      prisma.issue.count(),
      prisma.issue.count({ where: { status: 'OPEN' } }),
      prisma.issue.count({ where: { status: 'RESOLVED' } }),
      prisma.issue.count({ where: { priority: 'CRITICAL' } })
    ]);

    res.json({
      totalIssues,
      openIssues,
      resolvedIssues,
      criticalIssues
    });
  } catch (error) {
    console.error('Issues summary error:', error);
    res.status(500).json({ error: 'Failed to fetch issues summary' });
  }
});

// Quick notes for dashboard
router.get('/notes', authMiddleware, async (req, res) => {
  try {
    const notes = await prisma.projectNote.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } }
      }
    });
    // Đảm bảo title luôn hợp lệ
    const safeNotes = notes.map(n => ({
      ...n,
      title: n.title && n.title.trim() ? n.title : 'Ghi chú không tiêu đề'
    }));
    res.json({ notes: safeNotes });
  } catch (error) {
    console.error('Dashboard notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

export default router; 