const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearActivityLog() {
  try {
    // Xóa tất cả activity logs
    const result = await prisma.activityLog.deleteMany({});
    console.log(`Đã xóa ${result.count} activity logs`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearActivityLog(); 