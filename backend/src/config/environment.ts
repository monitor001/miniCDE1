// Backend Environment Configuration
export interface BackendConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  REDIS_URL: string;
  CORS_ORIGIN: string[];
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  AUTH_RATE_LIMIT_MAX: number;
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string[];
  REQUEST_TIMEOUT: number;
  RESPONSE_TIMEOUT: number;
  UPLOAD_PATH: string;
  ENABLE_PROJECT_STATS: boolean;
  ENABLE_PROJECT_EXPORT: boolean;
  ENABLE_PROJECT_SHARING: boolean;
  TRUST_PROXY: boolean;
  DEBUG_MODE: boolean;
}

// Development Environment
const developmentConfig: BackendConfig = {
  NODE_ENV: 'development',
  PORT: parseInt(process.env.PORT || '3001'),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://minicde_user:minicde_password@localhost:5432/minicde',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_key_2024',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  CORS_ORIGIN: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost',
    'http://127.0.0.1'
  ],
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 1000,
  AUTH_RATE_LIMIT_MAX: 50,
  MAX_FILE_SIZE: 104857600, // 100MB
  ALLOWED_FILE_TYPES: ['pdf', 'dwg', 'rvt', 'ifc', 'docx', 'xlsx', 'jpg', 'png'],
  REQUEST_TIMEOUT: 30000,
  RESPONSE_TIMEOUT: 30000,
  UPLOAD_PATH: './uploads',
  ENABLE_PROJECT_STATS: true,
  ENABLE_PROJECT_EXPORT: true,
  ENABLE_PROJECT_SHARING: true,
  TRUST_PROXY: false,
  DEBUG_MODE: true,
};

// Production Environment (Heroku)
const productionConfig: BackendConfig = {
  NODE_ENV: 'production',
  PORT: parseInt(process.env.PORT || '3001'),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'minicde_jwt_secret_2024_secure_production_key',
  REDIS_URL: process.env.REDIS_URL || '',
  CORS_ORIGIN: [
    'https://minicde-production-589be4b0d52b.herokuapp.com',
    'https://minicde-frontend-833302d6ab3c.herokuapp.com',
    'https://qlda.hoanglong24.com',
    'https://*.herokuapp.com',
    'https://*.vercel.app',
    'https://*.netlify.app',
    'https://*.railway.app'
  ],
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 1000,
  AUTH_RATE_LIMIT_MAX: 5,
  MAX_FILE_SIZE: 104857600, // 100MB
  ALLOWED_FILE_TYPES: ['pdf', 'dwg', 'rvt', 'ifc', 'docx', 'xlsx', 'jpg', 'png'],
  REQUEST_TIMEOUT: 30000,
  RESPONSE_TIMEOUT: 30000,
  UPLOAD_PATH: '/app/uploads',
  ENABLE_PROJECT_STATS: true,
  ENABLE_PROJECT_EXPORT: true,
  ENABLE_PROJECT_SHARING: true,
  TRUST_PROXY: true,
  DEBUG_MODE: false,
};

// Local Production Environment (Docker)
const localProductionConfig: BackendConfig = {
  NODE_ENV: 'production',
  PORT: parseInt(process.env.PORT || '3001'),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://minicde_user:minicde_password@postgres:5432/minicde',
  JWT_SECRET: process.env.JWT_SECRET || 'minicde_jwt_secret_2024_secure_production_key',
  REDIS_URL: process.env.REDIS_URL || 'redis://redis:6379',
  CORS_ORIGIN: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost',
    'http://127.0.0.1'
  ],
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 1000,
  AUTH_RATE_LIMIT_MAX: 5,
  MAX_FILE_SIZE: 104857600, // 100MB
  ALLOWED_FILE_TYPES: ['pdf', 'dwg', 'rvt', 'ifc', 'docx', 'xlsx', 'jpg', 'png'],
  REQUEST_TIMEOUT: 30000,
  RESPONSE_TIMEOUT: 30000,
  UPLOAD_PATH: '/app/uploads',
  ENABLE_PROJECT_STATS: true,
  ENABLE_PROJECT_EXPORT: true,
  ENABLE_PROJECT_SHARING: true,
  TRUST_PROXY: false,
  DEBUG_MODE: false,
};

// Get configuration based on environment
export const getBackendConfig = (): BackendConfig => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        ...productionConfig,
        CORS_ORIGIN: process.env.CORS_ORIGIN 
          ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
          : productionConfig.CORS_ORIGIN,
      };
    case 'local-production':
      return {
        ...localProductionConfig,
        CORS_ORIGIN: process.env.CORS_ORIGIN 
          ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
          : localProductionConfig.CORS_ORIGIN,
      };
    default:
      return {
        ...developmentConfig,
        CORS_ORIGIN: process.env.CORS_ORIGIN 
          ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
          : developmentConfig.CORS_ORIGIN,
      };
  }
};

// Export current configuration
export const backendConfig = getBackendConfig();

// Environment info for debugging
export const backendEnvironmentInfo = {
  current: process.env.NODE_ENV || 'development',
  config: backendConfig,
  port: process.env.PORT,
  databaseUrl: process.env.DATABASE_URL ? '***hidden***' : 'not set',
  redisUrl: process.env.REDIS_URL ? '***hidden***' : 'not set',
};

// Log environment info in development
if (backendConfig.DEBUG_MODE) {
  console.log('🌍 Backend Environment Info:', backendEnvironmentInfo);
  console.log('⚙️ Backend Config:', {
    ...backendConfig,
    DATABASE_URL: '***hidden***',
    JWT_SECRET: '***hidden***',
    REDIS_URL: '***hidden***',
  });
} 