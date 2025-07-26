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
exports.addCertification = exports.restoreDocumentVersion = exports.getDocumentHistory = exports.deleteDocument = exports.updateDocument = exports.createDocument = exports.getDocument = exports.getDocuments = void 0;
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
const getDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const documents = yield prisma.document.findMany({ include: { uploader: true, certifications: true, tasks: true } });
    res.json(documents);
});
exports.getDocuments = getDocuments;
const getDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const document = yield prisma.document.findUnique({ where: { id }, include: { uploader: true, certifications: true, tasks: true } });
    if (!document)
        return res.status(404).json({ error: 'Document not found' });
    res.json(document);
});
exports.getDocument = getDocument;
const createDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('POST /api/documents called', req.body);
        const { name, url, uploaderId, version, status, category } = req.body;
        const document = yield prisma.document.create({ data: { name, url, uploaderId, version, status, category } });
        // Lưu lịch sử tạo mới
        yield prisma.documentHistory.create({
            data: {
                documentId: document.id,
                name: document.name,
                url: document.url,
                version: document.version,
                action: 'upload',
                userId: uploaderId,
            }
        });
        if (typeof io !== 'undefined')
            io.emit('document:new', document);
        res.status(201).json(document);
    }
    catch (e) {
        const err = e;
        console.error('Error in createDocument:', err);
        res.status(400).json({ error: (err === null || err === void 0 ? void 0 : err.message) || String(err) || 'Error creating document' });
    }
});
exports.createDocument = createDocument;
const updateDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, url, version, status, category, userId } = req.body;
    try {
        const document = yield prisma.document.update({ where: { id }, data: { name, url, version, status, category } });
        // Lưu lịch sử cập nhật
        yield prisma.documentHistory.create({
            data: {
                documentId: document.id,
                name: document.name,
                url: document.url,
                version: document.version,
                action: 'update',
                userId: userId || document.uploaderId,
            }
        });
        if (status === 'Đã phê duyệt' && typeof io !== 'undefined')
            io.emit('document:approved', document);
        res.json(document);
    }
    catch (_a) {
        res.status(404).json({ error: 'Document not found' });
    }
});
exports.updateDocument = updateDocument;
const deleteDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const doc = yield prisma.document.findUnique({ where: { id } });
        if (doc) {
            yield prisma.documentHistory.create({
                data: {
                    documentId: doc.id,
                    name: doc.name,
                    url: doc.url,
                    version: doc.version,
                    action: 'delete',
                    userId: doc.uploaderId,
                }
            });
        }
        yield prisma.document.delete({ where: { id } });
        res.json({ message: 'Document deleted' });
    }
    catch (_a) {
        res.status(404).json({ error: 'Document not found' });
    }
});
exports.deleteDocument = deleteDocument;
// Lấy lịch sử tài liệu
const getDocumentHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const history = yield prisma.documentHistory.findMany({ where: { documentId: id }, orderBy: { createdAt: 'desc' } });
    res.json(history);
});
exports.getDocumentHistory = getDocumentHistory;
// Khôi phục phiên bản
const restoreDocumentVersion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, historyId } = req.body;
    const history = yield prisma.documentHistory.findUnique({ where: { id: historyId } });
    if (!history)
        return res.status(404).json({ error: 'History not found' });
    const document = yield prisma.document.update({
        where: { id },
        data: {
            name: history.name,
            url: history.url,
            version: history.version,
        }
    });
    // Lưu lịch sử khôi phục
    yield prisma.documentHistory.create({
        data: {
            documentId: document.id,
            name: document.name,
            url: document.url,
            version: document.version,
            action: 'restore',
            userId: document.uploaderId,
        }
    });
    res.json(document);
});
exports.restoreDocumentVersion = restoreDocumentVersion;
// Certification
const addCertification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { documentId, certifiedBy, status } = req.body;
    const certification = yield prisma.dataCertification.create({ data: { documentId, certifiedBy, status } });
    res.status(201).json(certification);
});
exports.addCertification = addCertification;
