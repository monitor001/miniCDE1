import { PrismaClient } from '@prisma/client';

// Configure Prisma client with connection pooling for Heroku
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Connection pooling configuration for Heroku
if (process.env.NODE_ENV === 'production') {
  console.log('Configuring database connection for production...');
  
  // Ensure we have both DATABASE_URL and DIRECT_URL
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined!');
  }
  
  if (!process.env.DIRECT_URL) {
    console.error('DIRECT_URL is not defined!');
  }
  
  // Heroku Postgres connection pooling
  try {
    // Connect to the database
    prisma.$connect()
      .then(() => console.log('Database connected successfully'))
      .catch(err => console.error('Database connection error:', err));
  } catch (error) {
    console.error('Error during database connection setup:', error);
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma }; 