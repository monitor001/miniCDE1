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
exports.addImage = exports.addNote = exports.deleteProject = exports.updateProject = exports.createProject = exports.getProject = exports.getProjects = void 0;
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const projects = yield prisma.project.findMany({
        include: { members: true, documents: true, tasks: true, notes: { include: { author: true } }, images: true }
    });
    res.json(projects);
});
exports.getProjects = getProjects;
const getProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const project = yield prisma.project.findUnique({
        where: { id },
        include: { members: true, documents: true, tasks: true, notes: { include: { author: true } }, images: true }
    });
    if (!project)
        return res.status(404).json({ error: 'Project not found' });
    res.json(project);
});
exports.getProject = getProject;
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, startDate, endDate, memberIds } = req.body;
    const project = yield prisma.project.create({
        data: {
            name, description, startDate, endDate,
            members: { connect: (memberIds === null || memberIds === void 0 ? void 0 : memberIds.map((id) => ({ id }))) || [] }
        }
    });
    res.status(201).json(project);
});
exports.createProject = createProject;
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, description, startDate, endDate, memberIds } = req.body;
    try {
        const project = yield prisma.project.update({
            where: { id },
            data: {
                name, description, startDate, endDate,
                members: memberIds ? { set: memberIds.map((id) => ({ id })) } : undefined
            }
        });
        res.json(project);
    }
    catch (_a) {
        res.status(404).json({ error: 'Project not found' });
    }
});
exports.updateProject = updateProject;
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.project.delete({ where: { id } });
        res.json({ message: 'Project deleted' });
    }
    catch (_a) {
        res.status(404).json({ error: 'Project not found' });
    }
});
exports.deleteProject = deleteProject;
const addNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId, content, authorId } = req.body;
    const note = yield prisma.note.create({ data: { projectId, content, authorId } });
    res.status(201).json(note);
});
exports.addNote = addNote;
const addImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId, uploadedById } = req.body;
    const url = req.file ? `/uploads/${req.file.filename}` : '';
    const image = yield prisma.projectImage.create({ data: { projectId, uploadedById, url } });
    res.status(201).json(image);
});
exports.addImage = addImage;
