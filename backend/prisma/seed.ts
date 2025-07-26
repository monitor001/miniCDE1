import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
const prisma = new PrismaClient();

async function main() {
  // Tạo user mẫu
  const user = await prisma.user.upsert({
    where: { email: 'demo@cde.com' },
    update: {},
    create: {
      email: 'demo@cde.com',
      password: '123456',
      name: 'Demo User',
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
      startDate: dayjs().add(1, 'day').hour(9).minute(0).second(0).toDate(),
      endDate: dayjs().add(1, 'day').hour(10).minute(0).second(0).toDate(),
      projectId: project.id,
      createdById: user.id,
      isAllDay: false,
      attendees: {
        create: [{ userId: user.id, status: 'ACCEPTED' }]
      }
    }
  });

  await prisma.calendarEvent.create({
    data: {
      title: 'Deadline nộp tài liệu',
      description: 'Hạn chót nộp tài liệu giai đoạn 1',
      type: 'DEADLINE',
      startDate: dayjs().add(3, 'day').hour(17).minute(0).second(0).toDate(),
      endDate: dayjs().add(3, 'day').hour(17).minute(0).second(0).toDate(),
      projectId: project.id,
      createdById: user.id,
      isAllDay: false,
      attendees: {
        create: [{ userId: user.id, status: 'INVITED' }]
      }
    }
  });

  await prisma.calendarEvent.create({
    data: {
      title: 'Milestone hoàn thành thiết kế',
      description: 'Cột mốc hoàn thành thiết kế sơ bộ',
      type: 'MILESTONE',
      startDate: dayjs().add(7, 'day').hour(0).minute(0).second(0).toDate(),
      endDate: dayjs().add(7, 'day').hour(23).minute(59).second(0).toDate(),
      projectId: project.id,
      createdById: user.id,
      isAllDay: true,
      attendees: {
        create: [{ userId: user.id, status: 'TENTATIVE' }]
      }
    }
  });

  console.log('Seed dữ liệu mẫu thành công!');
}

main().finally(() => prisma.$disconnect()); 