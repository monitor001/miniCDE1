const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestEvent() {
  try {
    console.log('Creating test event...');

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

    // Create test event for current time
    const now = new Date();
    const startTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

    const testEvent = await prisma.calendarEvent.create({
      data: {
        title: 'Test Event - Hiện tại',
        description: 'Sự kiện test để kiểm tra hiển thị calendar',
        type: 'MEETING',
        startDate: startTime,
        endDate: endTime,
        location: 'Phòng test',
        isAllDay: false,
        color: '#1890ff',
        reminder: 15,
        projectId: project.id,
        createdById: adminUser.id
      }
    });

    console.log('Created test event:', testEvent.title);
    console.log('Start time:', testEvent.startDate);
    console.log('End time:', testEvent.endDate);
    console.log('✅ Test event created successfully!');

  } catch (error) {
    console.error('Error creating test event:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestEvent(); 