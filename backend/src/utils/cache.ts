import { createClient } from 'redis';

// Redis client configuration
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '0'),
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Handle Redis events
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  });

redisClient.on('ready', () => {
  });

// Cache utility functions
export class CacheService {
  private static instance: CacheService;
  private client = redisClient;
  private defaultTTL = parseInt(process.env.REDIS_TTL || '3600'); // 1 hour

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttl || this.defaultTTL, serializedValue);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async flush(): Promise<void> {
    try {
      await this.client.flushDb();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  // Cache key generators
  static getProjectKey(projectId: string): string {
    return `project:${projectId}`;
  }

  static getProjectsKey(filters: any): string {
    const filterString = JSON.stringify(filters);
    return `projects:${Buffer.from(filterString).toString('base64')}`;
  }

  static getTasksKey(projectId: string, filters: any): string {
    const filterString = JSON.stringify(filters);
    return `tasks:${projectId}:${Buffer.from(filterString).toString('base64')}`;
  }

  static getDocumentsKey(projectId: string, filters: any): string {
    const filterString = JSON.stringify(filters);
    return `documents:${projectId}:${Buffer.from(filterString).toString('base64')}`;
  }

  static getUsersKey(filters: any): string {
    const filterString = JSON.stringify(filters);
    return `users:${Buffer.from(filterString).toString('base64')}`;
  }

  // Invalidate related caches
  async invalidateProject(projectId: string): Promise<void> {
    await Promise.all([
      this.del(CacheService.getProjectKey(projectId)),
      this.delPattern(`projects:*`),
      this.delPattern(`tasks:${projectId}:*`),
      this.delPattern(`documents:${projectId}:*`),
    ]);
  }

  async invalidateUser(userId: string): Promise<void> {
    await Promise.all([
      this.delPattern(`users:*`),
      this.delPattern(`projects:*`),
    ]);
  }

  async invalidateTasks(projectId: string): Promise<void> {
    await this.delPattern(`tasks:${projectId}:*`);
  }

  async invalidateDocuments(projectId: string): Promise<void> {
    await this.delPattern(`documents:${projectId}:*`);
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Middleware for caching responses
export const cacheMiddleware = (ttl?: number) => {
  return async (req: any, res: any, next: any) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.originalUrl}:${JSON.stringify(req.query)}`;
    
    try {
      const cached = await cacheService.get(key);
      if (cached) {
        return res.json(cached);
      }
    } catch (error) {
      console.error('Cache middleware error:', error);
    }

    // Store original send method
    const originalSend = res.json;
    
    // Override send method to cache response
    res.json = function(data: any) {
      cacheService.set(key, data, ttl);
      return originalSend.call(this, data);
    };

    next();
  };
}; 