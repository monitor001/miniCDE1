const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'admin@minicde.com' }
    });
    
    console.log('User found:', {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      twoFactorSecret: user?.twoFactorSecret ? 'ENABLED' : 'DISABLED'
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser(); 