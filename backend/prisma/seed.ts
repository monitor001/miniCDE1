import { PrismaClient, Role, ProjectStatus, ContainerStatus, DocumentStatus, TaskStatus, Priority } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean up existing data
  await prisma.taskHistory.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskDocument.deleteMany();
  await prisma.task.deleteMany();
  await prisma.documentHistory.deleteMany();
  await prisma.document.deleteMany();
  await prisma.container.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating users...');
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@minicde.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      organization: 'MiniCDE'
    }
  });
  
  // Create project manager
  const pmPassword = await bcrypt.hash('manager123', 10);
  const projectManager = await prisma.user.create({
    data: {
      email: 'pm@minicde.com',
      password: pmPassword,
      name: 'Project Manager',
      role: Role.PROJECT_MANAGER,
      organization: 'MiniCDE'
    }
  });
  
  // Create BIM manager
  const bimPassword = await bcrypt.hash('bim123', 10);
  const bimManager = await prisma.user.create({
    data: {
      email: 'bim@minicde.com',
      password: bimPassword,
      name: 'BIM Manager',
      role: Role.BIM_MANAGER,
      organization: 'MiniCDE'
    }
  });
  
  // Create contributor
  const contribPassword = await bcrypt.hash('contrib123', 10);
  const contributor = await prisma.user.create({
    data: {
      email: 'contributor@minicde.com',
      password: contribPassword,
      name: 'Contributor User',
      role: Role.CONTRIBUTOR,
      organization: 'MiniCDE'
    }
  });
  
  // Create viewer
  const viewerPassword = await bcrypt.hash('viewer123', 10);
  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@minicde.com',
      password: viewerPassword,
      name: 'Viewer User',
      role: Role.VIEWER,
      organization: 'MiniCDE'
    }
  });
  
  console.log('Creating projects...');
  
  // Create sample project
  const project1 = await prisma.project.create({
    data: {
      name: 'Office Building Project',
      description: 'A 10-story office building with underground parking',
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31')
    }
  });
  
  // Create another sample project
  const project2 = await prisma.project.create({
    data: {
      name: 'Residential Complex',
      description: 'Residential complex with 5 buildings and shared facilities',
      status: ProjectStatus.PLANNING,
      startDate: new Date('2024-03-01')
    }
  });
  
  console.log('Adding project members...');
  
  // Add members to Project 1
  await prisma.projectMember.createMany({
    data: [
      {
        userId: admin.id,
        projectId: project1.id,
        role: Role.ADMIN
      },
      {
        userId: projectManager.id,
        projectId: project1.id,
        role: Role.PROJECT_MANAGER
      },
      {
        userId: bimManager.id,
        projectId: project1.id,
        role: Role.BIM_MANAGER
      },
      {
        userId: contributor.id,
        projectId: project1.id,
        role: Role.CONTRIBUTOR
      },
      {
        userId: viewer.id,
        projectId: project1.id,
        role: Role.VIEWER
      }
    ]
  });
  
  // Add members to Project 2
  await prisma.projectMember.createMany({
    data: [
      {
        userId: admin.id,
        projectId: project2.id,
        role: Role.ADMIN
      },
      {
        userId: projectManager.id,
        projectId: project2.id,
        role: Role.PROJECT_MANAGER
      },
      {
        userId: bimManager.id,
        projectId: project2.id,
        role: Role.BIM_MANAGER
      }
    ]
  });
  
  console.log('Creating containers...');
  
  // Create containers for Project 1
  const project1Containers = await Promise.all([
    prisma.container.create({
      data: {
        name: 'Work in Progress',
        code: 'WIP',
        status: ContainerStatus.WORK_IN_PROGRESS,
        projectId: project1.id
      }
    }),
    prisma.container.create({
      data: {
        name: 'Shared',
        code: 'S',
        status: ContainerStatus.SHARED,
        projectId: project1.id
      }
    }),
    prisma.container.create({
      data: {
        name: 'Published',
        code: 'P',
        status: ContainerStatus.PUBLISHED,
        projectId: project1.id
      }
    }),
    prisma.container.create({
      data: {
        name: 'Archive',
        code: 'A',
        status: ContainerStatus.ARCHIVED,
        projectId: project1.id
      }
    })
  ]);
  
  // Create containers for Project 2
  const project2Containers = await Promise.all([
    prisma.container.create({
      data: {
        name: 'Work in Progress',
        code: 'WIP',
        status: ContainerStatus.WORK_IN_PROGRESS,
        projectId: project2.id
      }
    }),
    prisma.container.create({
      data: {
        name: 'Shared',
        code: 'S',
        status: ContainerStatus.SHARED,
        projectId: project2.id
      }
    }),
    prisma.container.create({
      data: {
        name: 'Published',
        code: 'P',
        status: ContainerStatus.PUBLISHED,
        projectId: project2.id
      }
    }),
    prisma.container.create({
      data: {
        name: 'Archive',
        code: 'A',
        status: ContainerStatus.ARCHIVED,
        projectId: project2.id
      }
    })
  ]);
  
  console.log('Creating sample documents...');
  
  // Create sample documents for Project 1
  const project1Documents = await Promise.all([
    prisma.document.create({
      data: {
        name: 'Architectural Plans',
        description: 'Main architectural plans for the office building',
        fileUrl: '/uploads/sample-architectural-plans.pdf',
        fileSize: 1024 * 1024 * 5, // 5MB
        fileType: 'pdf',
        version: 1,
        revisionCode: 'A01',
        status: DocumentStatus.WORK_IN_PROGRESS,
        metadata: {
          discipline: 'Architecture',
          level: 'LOD 300',
          author: 'John Architect'
        },
        projectId: project1.id,
        containerId: project1Containers[0].id, // WIP
        uploaderId: bimManager.id
      }
    }),
    prisma.document.create({
      data: {
        name: 'Structural Analysis',
        description: 'Structural analysis report',
        fileUrl: '/uploads/sample-structural-analysis.pdf',
        fileSize: 1024 * 1024 * 3, // 3MB
        fileType: 'pdf',
        version: 2,
        revisionCode: 'B02',
        status: DocumentStatus.SHARED,
        metadata: {
          discipline: 'Structural',
          level: 'LOD 350',
          author: 'Sarah Engineer'
        },
        projectId: project1.id,
        containerId: project1Containers[1].id, // Shared
        uploaderId: contributor.id
      }
    }),
    prisma.document.create({
      data: {
        name: 'MEP Coordination',
        description: 'Mechanical, Electrical, and Plumbing coordination model',
        fileUrl: '/uploads/sample-mep-model.ifc',
        fileSize: 1024 * 1024 * 15, // 15MB
        fileType: 'ifc',
        version: 1,
        revisionCode: 'A01',
        status: DocumentStatus.PUBLISHED,
        metadata: {
          discipline: 'MEP',
          level: 'LOD 400',
          author: 'MEP Team'
        },
        projectId: project1.id,
        containerId: project1Containers[2].id, // Published
        uploaderId: bimManager.id
      }
    })
  ]);
  
  console.log('Creating document history...');
  
  // Create document history
  await Promise.all([
    prisma.documentHistory.create({
      data: {
        documentId: project1Documents[0].id,
        version: 1,
        fileUrl: '/uploads/sample-architectural-plans.pdf',
        revisionCode: 'A01',
        status: DocumentStatus.WORK_IN_PROGRESS,
        updatedBy: bimManager.id,
        comment: 'Initial upload'
      }
    }),
    prisma.documentHistory.create({
      data: {
        documentId: project1Documents[1].id,
        version: 1,
        fileUrl: '/uploads/sample-structural-analysis-v1.pdf',
        revisionCode: 'A01',
        status: DocumentStatus.WORK_IN_PROGRESS,
        updatedBy: contributor.id,
        comment: 'Initial upload'
      }
    }),
    prisma.documentHistory.create({
      data: {
        documentId: project1Documents[1].id,
        version: 2,
        fileUrl: '/uploads/sample-structural-analysis.pdf',
        revisionCode: 'B02',
        status: DocumentStatus.SHARED,
        updatedBy: contributor.id,
        comment: 'Updated with feedback from review meeting'
      }
    }),
    prisma.documentHistory.create({
      data: {
        documentId: project1Documents[2].id,
        version: 1,
        fileUrl: '/uploads/sample-mep-model.ifc',
        revisionCode: 'A01',
        status: DocumentStatus.PUBLISHED,
        updatedBy: bimManager.id,
        comment: 'Initial upload'
      }
    })
  ]);
  
  console.log('Creating tasks...');
  
  // Create tasks for Project 1
  const project1Tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Review architectural plans',
        description: 'Review the architectural plans and provide feedback',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        assigneeId: bimManager.id,
        projectId: project1.id
      }
    }),
    prisma.task.create({
      data: {
        title: 'Update structural analysis',
        description: 'Update the structural analysis based on the latest architectural changes',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        assigneeId: contributor.id,
        projectId: project1.id
      }
    }),
    prisma.task.create({
      data: {
        title: 'Coordinate MEP systems',
        description: 'Ensure all MEP systems are properly coordinated and clash-free',
        status: TaskStatus.COMPLETED,
        priority: Priority.URGENT,
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        assigneeId: bimManager.id,
        projectId: project1.id
      }
    })
  ]);
  
  console.log('Linking tasks to documents...');
  
  // Link tasks to documents
  await Promise.all([
    prisma.taskDocument.create({
      data: {
        taskId: project1Tasks[0].id,
        documentId: project1Documents[0].id
      }
    }),
    prisma.taskDocument.create({
      data: {
        taskId: project1Tasks[1].id,
        documentId: project1Documents[1].id
      }
    }),
    prisma.taskDocument.create({
      data: {
        taskId: project1Tasks[2].id,
        documentId: project1Documents[2].id
      }
    })
  ]);
  
  console.log('Creating task comments...');
  
  // Create task comments
  await Promise.all([
    prisma.comment.create({
      data: {
        content: 'I\'ve started the review. Will provide detailed feedback by tomorrow.',
        taskId: project1Tasks[0].id,
        userId: bimManager.id
      }
    }),
    prisma.comment.create({
      data: {
        content: 'Please check the column dimensions on the 3rd floor.',
        taskId: project1Tasks[1].id,
        userId: projectManager.id
      }
    }),
    prisma.comment.create({
      data: {
        content: 'I\'ll update the analysis with the new dimensions.',
        taskId: project1Tasks[1].id,
        userId: contributor.id
      }
    }),
    prisma.comment.create({
      data: {
        content: 'All MEP systems have been coordinated and clash detection completed.',
        taskId: project1Tasks[2].id,
        userId: bimManager.id
      }
    })
  ]);
  
  console.log('Creating task history...');
  
  // Create task history
  await Promise.all([
    prisma.taskHistory.create({
      data: {
        taskId: project1Tasks[0].id,
        action: 'Created',
        details: 'Task created and assigned to BIM Manager',
        userId: projectManager.id
      }
    }),
    prisma.taskHistory.create({
      data: {
        taskId: project1Tasks[0].id,
        action: 'Status updated',
        details: 'Status changed from TODO to IN_PROGRESS',
        userId: bimManager.id
      }
    }),
    prisma.taskHistory.create({
      data: {
        taskId: project1Tasks[1].id,
        action: 'Created',
        details: 'Task created and assigned to Contributor',
        userId: projectManager.id
      }
    }),
    prisma.taskHistory.create({
      data: {
        taskId: project1Tasks[2].id,
        action: 'Created',
        details: 'Task created and assigned to BIM Manager',
        userId: projectManager.id
      }
    }),
    prisma.taskHistory.create({
      data: {
        taskId: project1Tasks[2].id,
        action: 'Status updated',
        details: 'Status changed from TODO to IN_PROGRESS',
        userId: bimManager.id
      }
    }),
    prisma.taskHistory.create({
      data: {
        taskId: project1Tasks[2].id,
        action: 'Status updated',
        details: 'Status changed from IN_PROGRESS to COMPLETED',
        userId: bimManager.id
      }
    })
  ]);
  
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 