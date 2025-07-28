const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeDemoUser() {
  try {
    console.log('🔍 Đang tìm tài khoản demo...');
    
    // Tìm tài khoản demo
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@cde.com' }
    });

    if (demoUser) {
      console.log('❌ Tìm thấy tài khoản demo, đang xóa...');
      
      // Xóa tài khoản demo
      await prisma.user.delete({
        where: { email: 'demo@cde.com' }
      });
      
      console.log('✅ Đã xóa tài khoản demo thành công!');
    } else {
      console.log('✅ Không tìm thấy tài khoản demo, không cần xóa.');
    }

    // Kiểm tra tài khoản admin chính
    const adminUser = await prisma.user.findUnique({
      where: { email: 'nguyenthanhvc@gmail.com' }
    });

    if (adminUser) {
      console.log('✅ Tài khoản admin chính vẫn tồn tại.');
    } else {
      console.log('⚠️  Tài khoản admin chính không tồn tại!');
    }

  } catch (error) {
    console.error('❌ Lỗi khi xóa tài khoản demo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeDemoUser(); 