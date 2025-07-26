"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectController_1 = require("../controllers/projectController");
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
        cb(null, base + '-' + Date.now() + ext);
    }
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
router.get('/', projectController_1.getProjects);
router.get('/:id', projectController_1.getProject);
router.post('/', projectController_1.createProject);
router.put('/:id', projectController_1.updateProject);
router.delete('/:id', projectController_1.deleteProject);
router.post('/:id/note', projectController_1.addNote);
router.post('/:id/image', upload.single('file'), projectController_1.addImage);
exports.default = router;
