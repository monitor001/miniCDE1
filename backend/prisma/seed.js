"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    // Tạo tài khoản admin duy nhất
    const admin = await prisma.user.upsert({
        where: { email: 'nguyenthanhvc@gmail.com' },
        update: {},
        create: {
            email: 'nguyenthanhvc@gmail.com',
            password: await bcryptjs_1.default.hash('Ab5463698664#', 10),
            name: 'Nguyen Thanh',
            role: 'ADMIN',
        },
    });
    // Xoá toàn bộ dữ liệu mẫu (trừ user admin)
    await prisma.calendarEventAttendee.deleteMany({});
    await prisma.taskDocument.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.taskHistory.deleteMany({});
    await prisma.activityLog.deleteMany({});
    await prisma.issue.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.calendarEvent.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.project.deleteMany({});
    // Có thể bổ sung các bảng khác nếu cần
    // Không seed lại dữ liệu mẫu nào khác ngoài user
    console.log('Seed dữ liệu mẫu thành công!');
}
main().finally(() => prisma.$disconnect());
