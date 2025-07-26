import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
declare const io: Server;

const prisma = new PrismaClient();

export const getTasks = async (req: Request, res: Response) => {
  const tasks = await prisma.task.findMany({ include: { assignee: true, comments: true, documents: true, history: true } });
  res.json(tasks);
};

export const getTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const task = await prisma.task.findUnique({ where: { id }, include: { assignee: true, comments: true, documents: true, history: true } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
};

export const createTask = async (req: Request, res: Response) => {
  const { title, description, status, dueDate, assigneeId, projectId, priority } = req.body;
  const task = await prisma.task.create({ 
    data: { 
      title, 
      description, 
      status, 
      dueDate: dueDate ? new Date(dueDate) : undefined, 
      assigneeId,
      projectId,
      priority: priority || 'MEDIUM'
    } 
  });
  // Emit event
  if (typeof io !== 'undefined') io.emit('task:new', task);
  res.status(201).json(task);
};

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, status, dueDate, assigneeId } = req.body;
  try {
    const task = await prisma.task.update({ where: { id }, data: { title, description, status, dueDate: new Date(dueDate), assigneeId } });
    res.json(task);
  } catch {
    res.status(404).json({ error: 'Task not found' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(404).json({ error: 'Task not found' });
  }
};

// Comment
export const addComment = async (req: Request, res: Response) => {
  const { taskId, userId, content } = req.body;
  const comment = await prisma.comment.create({ data: { taskId, userId, content } });
  if (typeof io !== 'undefined') io.emit('comment:new', comment);
  res.status(201).json(comment);
};

// History
export const addHistory = async (req: Request, res: Response) => {
  const { taskId, userId, action } = req.body;
  const history = await prisma.taskHistory.create({ data: { taskId, userId, action } });
  res.status(201).json(history);
}; 