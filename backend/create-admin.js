const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await prisma.user.findFirst({
      where: { email: 'admin@minicde.com' }
    });
    
    if (existingUser) {
      console.log('Admin user already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role
      });
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Tạo admin user
    const user = await prisma.user.create({
      data: {
        email: 'admin@minicde.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        organization: 'MiniCDE'
      }
    });
    
    console.log('Admin user created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
    
    console.log('Login credentials:');
    console.log('Email: admin@minicde.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 