const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCreateIssue() {
  try {
    // Lấy project đầu tiên
    const project = await prisma.project.findFirst();
    console.log('Project found:', project);

    // Lấy user đầu tiên
    const user = await prisma.user.findFirst();
    console.log('User found:', user);

    if (!project || !user) {
      console.log('No project or user found');
      return;
    }

    // Tạo issue test
    const issue = await prisma.issue.create({
      data: {
        code: `ISSUE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: 'Test Issue',
        description: 'Test Description',
        type: 'ISSUE',
        status: 'NEW',
        priority: 'MEDIUM',
        projectId: project.id,
        createdById: user.id,
        assigneeId: user.id
      }
    });

    console.log('Issue created successfully:', issue);
  } catch (error) {
    console.error('Error creating issue:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateIssue(); 