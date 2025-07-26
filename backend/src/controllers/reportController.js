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
exports.getStats = exports.createReport = exports.getReports = void 0;
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
const getReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reports = yield prisma.report.findMany();
    res.json(reports);
});
exports.getReports = getReports;
const createReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, data } = req.body;
    const report = yield prisma.report.create({ data: { type, data } });
    res.status(201).json(report);
});
exports.createReport = createReport;
const getStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('GET /api/reports/stats called');
    const [taskCount, documentCount, userCount] = yield Promise.all([
        prisma.task.count(),
        prisma.document.count(),
        prisma.user.count(),
    ]);
    res.json({ taskCount, documentCount, userCount });
});
exports.getStats = getStats;
