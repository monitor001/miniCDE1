"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addHistory = exports.addComment = exports.deleteTask = exports.updateTask = exports.createTask = exports.getTask = exports.getTasks = void 0;
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tasks = yield prisma.task.findMany({ include: { assignee: true, comments: true, documents: true, history: true } });
    res.json(tasks);
});
exports.getTasks = getTasks;
const getTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const task = yield prisma.task.findUnique({ where: { id }, include: { assignee: true, comments: true, documents: true, history: true } });
    if (!task)
        return res.status(404).json({ error: 'Task not found' });
    res.json(task);
});
exports.getTask = getTask;
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, status, dueDate, assigneeId } = req.body;
    const task = yield prisma.task.create({ data: { title, description, status, dueDate: new Date(dueDate), assigneeId } });
    // Emit event
    if (typeof io !== 'undefined')
        io.emit('task:new', task);
    res.status(201).json(task);
});
exports.createTask = createTask;
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, description, status, dueDate, assigneeId } = req.body;
    try {
        const task = yield prisma.task.update({ where: { id }, data: { title, description, status, dueDate: new Date(dueDate), assigneeId } });
        res.json(task);
    }
    catch (_a) {
        res.status(404).json({ error: 'Task not found' });
    }
});
exports.updateTask = updateTask;
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.task.delete({ where: { id } });
        res.json({ message: 'Task deleted' });
    }
    catch (_a) {
        res.status(404).json({ error: 'Task not found' });
    }
});
exports.deleteTask = deleteTask;
// Comment
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId, userId, content } = req.body;
    const comment = yield prisma.comment.create({ data: { taskId, userId, content } });
    if (typeof io !== 'undefined')
        io.emit('comment:new', comment);
    res.status(201).json(comment);
});
exports.addComment = addComment;
// History
const addHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId, userId, action } = req.body;
    const history = yield prisma.taskHistory.create({ data: { taskId, userId, action } });
    res.status(201).json(history);
});
exports.addHistory = addHistory;
