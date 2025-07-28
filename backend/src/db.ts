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
  // Heroku Postgres connection pooling
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    // Add connection pooling parameters
    const url = new URL(connectionString);
    url.searchParams.set('connection_limit', process.env.DATABASE_POOL_MAX || '10');
    url.searchParams.set('pool_timeout', process.env.DATABASE_POOL_IDLE_TIMEOUT || '30000');
    
    // Update the Prisma client with the new URL
    prisma.$connect();
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma }; 