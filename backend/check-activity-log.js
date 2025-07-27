const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkActivityLog() {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('Recent Activity Logs:');
    logs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.createdAt.toLocaleString()}] ${log.user?.name || log.user?.email || 'Unknown'}: ${log.description}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActivityLog(); 