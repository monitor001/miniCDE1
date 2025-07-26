"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentController_1 = require("../controllers/documentController");
const auth_1 = require("../middlewares/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => { cb(null, path_1.default.join(__dirname, '../../public/uploads')); },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const base = path_1.default.basename(file.originalname, ext);
        cb(null, base + '-' + Date.now() + ext); // Unique filename
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.docx', '.xlsx', '.jpg', '.jpeg', '.png'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (!allowed.includes(ext))
            return cb(new Error('Chỉ cho phép file pdf, docx, xlsx, jpg, png!'));
        cb(null, true);
    }
});
router.post('/upload', auth_1.requireAdmin, upload.single('file'), (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
});
router.get('/', documentController_1.getDocuments);
router.get('/:id', documentController_1.getDocument);
router.get('/:id/history', documentController_1.getDocumentHistory);
router.post('/:id/restore', auth_1.requireAdmin, documentController_1.restoreDocumentVersion);
router.post('/', auth_1.requireAdmin, documentController_1.createDocument);
router.put('/:id', auth_1.requireAdmin, documentController_1.updateDocument);
router.delete('/:id', auth_1.requireAdmin, documentController_1.deleteDocument);
router.post('/:id/certification', auth_1.requireAdmin, documentController_1.addCertification);
exports.default = router;
