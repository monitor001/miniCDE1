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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateMe = exports.getMe = exports.deleteUser = exports.updateUser = exports.getUser = exports.getUsers = void 0;
const prisma_1 = require("../generated/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new prisma_1.PrismaClient();
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true } });
    res.json(users);
});
exports.getUsers = getUsers;
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = yield prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true } });
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    res.json(user);
});
exports.getUser = getUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, role } = req.body;
    try {
        const user = yield prisma.user.update({ where: { id }, data: { name, role } });
        res.json(user);
    }
    catch (_a) {
        res.status(404).json({ error: 'User not found' });
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted' });
    }
    catch (_a) {
        res.status(404).json({ error: 'User not found' });
    }
});
exports.deleteUser = deleteUser;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('GET /api/users/me called');
    // Lấy userId từ req.user (middleware authenticate)
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    const user = yield prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true } });
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    res.json(user);
});
exports.getMe = getMe;
const updateMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    const { name, email } = req.body;
    try {
        const user = yield prisma.user.update({ where: { id: userId }, data: { name, email } });
        res.json(user);
    }
    catch (e) {
        res.status(400).json({ error: 'Email already exists or invalid' });
    }
});
exports.updateMe = updateMe;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    const { oldPassword, newPassword } = req.body;
    const user = yield prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    const valid = yield bcryptjs_1.default.compare(oldPassword, user.password);
    if (!valid)
        return res.status(400).json({ error: 'Mật khẩu cũ không đúng' });
    const hashed = yield bcryptjs_1.default.hash(newPassword, 10);
    yield prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    res.json({ message: 'Đổi mật khẩu thành công' });
});
exports.changePassword = changePassword;
