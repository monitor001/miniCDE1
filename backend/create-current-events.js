const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCurrentEvents() {
  try {
    console.log('Creating current calendar events...');

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@minicde.com' }
    });

    if (!adminUser) {
      console.error('Admin user not found');
      return;
    }

    // Get first project
    const project = await prisma.project.findFirst();
    if (!project) {
      console.error('No project found');
      return;
    }

    // Get current date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Create current calendar events
    const events = await Promise.all([
      prisma.calendarEvent.create({
        data: {
          title: 'Họp dự án hôm nay',
          description: 'Họp đánh giá tiến độ dự án hàng ngày',
          type: 'MEETING',
          startDate: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00 AM today
          endDate: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00 AM today
          location: 'Phòng họp A',
          isAllDay: false,
          color: '#1890ff',
          reminder: 15,
          projectId: project.id,
          createdById: adminUser.id
        }
      }),
      prisma.calendarEvent.create({
        data: {
          title: 'Deadline báo cáo tuần',
          description: 'Hạn chót nộp báo cáo tuần cho dự án',
          type: 'DEADLINE',
          startDate: new Date(tomorrow.getTime() + 17 * 60 * 60 * 1000), // 5:00 PM tomorrow
          endDate: new Date(tomorrow.getTime() + 17 * 60 * 60 * 1000), // 5:00 PM tomorrow
          location: 'Văn phòng',
          isAllDay: true,
          color: '#ff4d4f',
          reminder: 60,
          projectId: project.id,
          createdById: adminUser.id
        }
      }),
      prisma.calendarEvent.create({
        data: {
          title: 'Milestone hoàn thành thiết kế',
          description: 'Đánh dấu hoàn thành giai đoạn thiết kế',
          type: 'MILESTONE',
          startDate: new Date(nextWeek.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM next week
          endDate: new Date(nextWeek.getTime() + 15 * 60 * 60 * 1000), // 3:00 PM next week
          location: 'Phòng thiết kế',
          isAllDay: false,
          color: '#faad14',
          reminder: 30,
          projectId: project.id,
          createdById: adminUser.id
        }
      }),
      prisma.calendarEvent.create({
        data: {
          title: 'Thuyết trình cho khách hàng',
          description: 'Thuyết trình phương án thiết kế cho khách hàng',
          type: 'EVENT',
          startDate: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM today
          endDate: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 4:00 PM today
          location: 'Hội trường chính',
          isAllDay: false,
          color: '#52c41a',
          reminder: 30,
          projectId: project.id,
          createdById: adminUser.id
        }
      }),
      prisma.calendarEvent.create({
        data: {
          title: 'Họp kỹ thuật chiều',
          description: 'Họp thảo luận các vấn đề kỹ thuật',
          type: 'MEETING',
          startDate: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3:00 PM today
          endDate: new Date(today.getTime() + 16 * 30 * 60 * 1000), // 4:30 PM today
          location: 'Phòng họp B',
          isAllDay: false,
          color: '#1890ff',
          reminder: 15,
          projectId: project.id,
          createdById: adminUser.id
        }
      })
    ]);

    console.log('Created', events.length, 'current calendar events');
    console.log('✅ Current calendar events created successfully!');

  } catch (error) {
    console.error('Error creating current calendar events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCurrentEvents(); 