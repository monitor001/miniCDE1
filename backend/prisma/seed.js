"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const dayjs_1 = __importDefault(require("dayjs"));
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
    // Tạo project mẫu (nếu chưa có)
    let project = await prisma.project.findFirst({ where: { name: 'Dự án mẫu' } });
    if (!project) {
        project = await prisma.project.create({
            data: {
                name: 'Dự án mẫu',
                description: 'Dự án kiểm thử seed lịch',
                status: 'ACTIVE',
                priority: 'HIGH',
            },
        });
    }
    // Tạo sự kiện lịch mẫu
    await prisma.calendarEvent.create({
        data: {
            title: 'Họp kickoff dự án',
            description: 'Cuộc họp khởi động dự án mẫu',
            type: 'MEETING',
            startDate: (0, dayjs_1.default)().add(1, 'day').hour(9).minute(0).second(0).toDate(),
            endDate: (0, dayjs_1.default)().add(1, 'day').hour(10).minute(0).second(0).toDate(),
            projectId: project.id,
            createdById: admin.id,
            isAllDay: false,
            attendees: {
                create: [{ userId: admin.id, status: 'ACCEPTED' }]
            }
        }
    });
    await prisma.calendarEvent.create({
        data: {
            title: 'Deadline nộp tài liệu',
            description: 'Hạn chót nộp tài liệu giai đoạn 1',
            type: 'DEADLINE',
            startDate: (0, dayjs_1.default)().add(3, 'day').hour(17).minute(0).second(0).toDate(),
            endDate: (0, dayjs_1.default)().add(3, 'day').hour(17).minute(0).second(0).toDate(),
            projectId: project.id,
            createdById: admin.id,
            isAllDay: false,
            attendees: {
                create: [{ userId: admin.id, status: 'INVITED' }]
            }
        }
    });
    await prisma.calendarEvent.create({
        data: {
            title: 'Milestone hoàn thành thiết kế',
            description: 'Cột mốc hoàn thành thiết kế sơ bộ',
            type: 'MILESTONE',
            startDate: (0, dayjs_1.default)().add(7, 'day').hour(0).minute(0).second(0).toDate(),
            endDate: (0, dayjs_1.default)().add(7, 'day').hour(23).minute(59).second(0).toDate(),
            projectId: project.id,
            createdById: admin.id,
            isAllDay: true,
            attendees: {
                create: [{ userId: admin.id, status: 'TENTATIVE' }]
            }
        }
    });
    // Tạo task mẫu có trường startDate
    await prisma.task.create({
      data: {
        title: 'Nhiệm vụ mẫu',
        description: 'Đây là nhiệm vụ mẫu có ngày bắt đầu',
        status: 'TODO',
        priority: 'HIGH',
        startDate: new Date(),
        dueDate: (0, dayjs_1.default)().add(5, 'day').toDate(),
        assigneeId: admin.id,
        projectId: project.id,
      }
    });
    // Cập nhật các task cũ bị thiếu startDate
    await prisma.task.updateMany({
      where: { startDate: null },
      data: { startDate: new Date() }
    });
    console.log('Seed dữ liệu mẫu thành công!');
}
main().finally(() => prisma.$disconnect());
