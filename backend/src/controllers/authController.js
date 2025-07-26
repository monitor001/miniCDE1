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
exports.verify2FA = exports.login = exports.register = void 0;
const prisma_1 = require("../generated/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new prisma_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const twoFALockout = {};
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name, role } = req.body;
    try {
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma.user.create({
            data: { email, password: hashedPassword, name, role },
        });
        res.status(201).json({ message: 'User registered', user });
    }
    catch (error) {
        res.status(400).json({ error: 'Email already exists' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    const valid = yield bcryptjs_1.default.compare(password, user.password);
    if (!valid)
        return res.status(401).json({ error: 'Invalid credentials' });
    // BỎ QUA 2FA: luôn trả về token, không kiểm tra user.twoFASecret
    const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
});
exports.login = login;
// Xác thực 2FA (giả lập, thực tế sẽ dùng speakeasy hoặc otp)
const verify2FA = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, code } = req.body;
    const user = yield prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFASecret)
        return res.status(400).json({ error: 'Invalid user or 2FA not setup' });
    const now = Date.now();
    if (twoFALockout[userId] && twoFALockout[userId].until > now) {
        return res.status(429).json({ error: '2FA bị khóa tạm thời, vui lòng thử lại sau 5 phút.' });
    }
    if (code === '123456') { // demo
        delete twoFALockout[userId];
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, user });
    }
    // Sai mã 2FA
    if (!twoFALockout[userId])
        twoFALockout[userId] = { count: 1, until: 0 };
    else
        twoFALockout[userId].count++;
    if (twoFALockout[userId].count >= 5) {
        twoFALockout[userId].until = now + 5 * 60 * 1000;
        return res.status(429).json({ error: '2FA bị khóa tạm thời, vui lòng thử lại sau 5 phút.' });
    }
    return res.status(401).json({ error: 'Invalid 2FA code' });
});
exports.verify2FA = verify2FA;
