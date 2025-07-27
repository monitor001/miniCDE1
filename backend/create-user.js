const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);
    
    // Tạo user mới
    const user = await prisma.user.create({
      data: {
        email: 'test@minicde.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'ADMIN',
        organization: 'MiniCDE'
      }
    });
    
    console.log('User created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser(); 