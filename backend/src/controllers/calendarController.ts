import { Request, Response } from 'express';
import { prisma } from '../db';

// Lấy tất cả sự kiện (có thể filter theo project, type, thời gian)
export const getCalendarEvents = async (req: Request, res: Response) => {
  try {
    const { projectId, type, from, to } = req.query;
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (type) where.type = type;
    if (from || to) {
      where.OR = [
        from ? { endDate: { gte: new Date(from as string) } } : {},
        to ? { startDate: { lte: new Date(to as string) } } : {},
      ];
    }
    
    const events = await prisma.calendarEvent.findMany({
      where,
      include: { 
        attendees: { include: { user: true } }, 
        createdBy: true, 
        project: true 
      },
      orderBy: { startDate: 'asc' }
    });
    
    res.json(events);
  } catch (err) {
    console.error('Error fetching calendar events:', err);
    res.status(500).json({ error: 'Không thể lấy danh sách sự kiện' });
  }
};

// Lấy chi tiết sự kiện
export const getCalendarEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      include: { 
        attendees: { include: { user: true } }, 
        createdBy: true, 
        project: true 
      }
    });
    if (!event) return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    res.json(event);
  } catch (err) {
    console.error('Error fetching calendar event:', err);
    res.status(500).json({ error: 'Không thể lấy chi tiết sự kiện' });
  }
};

// Tạo mới sự kiện
export const createCalendarEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, type, startDate, endDate, location, isAllDay, color, reminder, projectId, attendees } = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        isAllDay: isAllDay || false,
        color,
        reminder,
        projectId,
        createdById: userId,
        attendees: attendees && Array.isArray(attendees) ? {
          create: attendees.map((a: any) => ({
            userId: a.userId || a,
            status: a.status || 'INVITED'
          }))
        } : undefined
      },
      include: { 
        attendees: { include: { user: true } }, 
        createdBy: true, 
        project: true 
      }
    });

    // Emit socket event
    if (global.io) global.io.emit('calendar:event:created', event);
    res.status(201).json(event);
  } catch (err) {
    console.error('Error creating calendar event:', err);
    res.status(500).json({ error: 'Không thể tạo sự kiện' });
  }
};

// Cập nhật sự kiện
export const updateCalendarEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, type, startDate, endDate, location, isAllDay, color, reminder, projectId, attendees } = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Kiểm tra phân quyền
    const event = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    
    const userRole = (req as any).user?.role;
    if (
      userId !== event.createdById &&
      !['ADMIN', 'PROJECT_MANAGER', 'BIM_MANAGER'].includes(userRole || '')
    ) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa sự kiện này' });
    }

    // Xóa attendees cũ và thêm mới
    await prisma.calendarEventAttendee.deleteMany({ where: { eventId: id } });
    
    const updatedEvent = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title,
        description,
        type,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        location,
        isAllDay: isAllDay || false,
        color,
        reminder,
        projectId,
        attendees: attendees && Array.isArray(attendees) ? {
          create: attendees.map((a: any) => ({
            userId: a.userId || a,
            status: a.status || 'INVITED'
          }))
        } : undefined
      },
      include: { 
        attendees: { include: { user: true } }, 
        createdBy: true, 
        project: true 
      }
    });

    // Emit socket event
    if (global.io) global.io.emit('calendar:event:updated', updatedEvent);
    res.json(updatedEvent);
  } catch (err) {
    console.error('Error updating calendar event:', err);
    res.status(500).json({ error: 'Không thể cập nhật sự kiện' });
  }
};

// API cập nhật trạng thái tham gia cho attendee
export const updateAttendeeStatus = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const attendee = await prisma.calendarEventAttendee.findUnique({
      where: { eventId_userId: { eventId, userId } }
    });
    
    if (!attendee) {
      return res.status(404).json({ error: 'Bạn không phải người tham gia sự kiện này' });
    }

    const updated = await prisma.calendarEventAttendee.update({
      where: { eventId_userId: { eventId, userId } },
      data: { status }
    });

    // Emit socket event
    if (global.io) global.io.emit('calendar:attendee:status', { eventId, userId, status });
    res.json(updated);
  } catch (err) {
    console.error('Error updating attendee status:', err);
    res.status(500).json({ error: 'Không thể cập nhật trạng thái tham gia' });
  }
};

// Xóa sự kiện
export const deleteCalendarEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Kiểm tra phân quyền
    const event = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    
    const userRole = (req as any).user?.role;
    if (
      userId !== event.createdById &&
      !['ADMIN', 'PROJECT_MANAGER', 'BIM_MANAGER'].includes(userRole || '')
    ) {
      return res.status(403).json({ error: 'Bạn không có quyền xoá sự kiện này' });
    }

    await prisma.calendarEventAttendee.deleteMany({ where: { eventId: id } });
    await prisma.calendarEvent.delete({ where: { id } });

    // Emit socket event
    if (global.io) global.io.emit('calendar:event:deleted', { id });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting calendar event:', err);
    res.status(500).json({ error: 'Không thể xóa sự kiện' });
  }
}; 