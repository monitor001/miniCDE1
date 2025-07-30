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
require("dotenv/config");
const client_1 = require("@prisma/client");
const dayjs_1 = __importDefault(require("dayjs"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Tạo user mẫu
        const user = yield prisma.user.upsert({
            where: { email: 'demo@cde.com' },
            update: {},
            create: {
                email: 'demo@cde.com',
                password: '123456',
                name: 'Demo User',
                role: 'ADMIN',
            },
        });
        // Thêm tài khoản admin mới theo yêu cầu
        const admin2 = yield prisma.user.upsert({
            where: { email: 'nguyenthanhvc@gmail.com' },
            update: {},
            create: {
                email: 'nguyenthanhvc@gmail.com',
                password: yield bcryptjs_1.default.hash('Ab5463698664#', 10),
                name: 'Nguyen Thanh',
                role: 'ADMIN',
            },
        });
        // Tạo project mẫu (nếu chưa có)
        let project = yield prisma.project.findFirst({ where: { name: 'Dự án mẫu' } });
        if (!project) {
            project = yield prisma.project.create({
                data: {
                    name: 'Dự án mẫu',
                    description: 'Dự án kiểm thử seed lịch',
                    status: 'ACTIVE',
                    priority: 'HIGH',
                },
            });
        }
        // Tạo sự kiện lịch mẫu
        yield prisma.calendarEvent.create({
            data: {
                title: 'Họp kickoff dự án',
                description: 'Cuộc họp khởi động dự án mẫu',
                type: 'MEETING',
                startDate: (0, dayjs_1.default)().add(1, 'day').hour(9).minute(0).second(0).toDate(),
                endDate: (0, dayjs_1.default)().add(1, 'day').hour(10).minute(0).second(0).toDate(),
                projectId: project.id,
                createdById: user.id,
                isAllDay: false,
                attendees: {
                    create: [{ userId: user.id, status: 'ACCEPTED' }]
                }
            }
        });
        yield prisma.calendarEvent.create({
            data: {
                title: 'Deadline nộp tài liệu',
                description: 'Hạn chót nộp tài liệu giai đoạn 1',
                type: 'DEADLINE',
                startDate: (0, dayjs_1.default)().add(3, 'day').hour(17).minute(0).second(0).toDate(),
                endDate: (0, dayjs_1.default)().add(3, 'day').hour(17).minute(0).second(0).toDate(),
                projectId: project.id,
                createdById: user.id,
                isAllDay: false,
                attendees: {
                    create: [{ userId: user.id, status: 'INVITED' }]
                }
            }
        });
        yield prisma.calendarEvent.create({
            data: {
                title: 'Milestone hoàn thành thiết kế',
                description: 'Cột mốc hoàn thành thiết kế sơ bộ',
                type: 'MILESTONE',
                startDate: (0, dayjs_1.default)().add(7, 'day').hour(0).minute(0).second(0).toDate(),
                endDate: (0, dayjs_1.default)().add(7, 'day').hour(23).minute(59).second(0).toDate(),
                projectId: project.id,
                createdById: user.id,
                isAllDay: true,
                attendees: {
                    create: [{ userId: user.id, status: 'TENTATIVE' }]
                }
            }
        });
        console.log('Seed dữ liệu mẫu thành công!');
    });
}
main().finally(() => prisma.$disconnect());
