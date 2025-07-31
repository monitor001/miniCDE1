// Environment Configuration
export interface EnvironmentConfig {
  API_URL: string;
  SOCKET_URL: string;
  APP_TITLE: string;
  ENABLE_PROJECT_CARDS: boolean;
  ENABLE_EXPORT: boolean;
  ENABLE_SHARING: boolean;
  REQUEST_TIMEOUT: number;
  DEBUG_MODE: boolean;
}

// Development Environment
const developmentConfig: EnvironmentConfig = {
  API_URL: 'http://localhost:3002/api',
  SOCKET_URL: 'http://localhost:3002',
  APP_TITLE: 'MiniCDE - Development',
  ENABLE_PROJECT_CARDS: true,
  ENABLE_EXPORT: true,
  ENABLE_SHARING: true,
  REQUEST_TIMEOUT: 30000,
  DEBUG_MODE: true,
};

// Production Environment (Heroku)
const productionConfig: EnvironmentConfig = {
  API_URL: 'https://minicde-production-589be4b0d52b.herokuapp.com/api',
  SOCKET_URL: 'https://minicde-production-589be4b0d52b.herokuapp.com',
  APP_TITLE: 'Quản lý dự án',
  ENABLE_PROJECT_CARDS: true,
  ENABLE_EXPORT: true,
  ENABLE_SHARING: true,
  REQUEST_TIMEOUT: 30000,
  DEBUG_MODE: false,
};

// Local Production Environment (Docker)
const localProductionConfig: EnvironmentConfig = {
  API_URL: 'http://localhost/api',
  SOCKET_URL: 'http://localhost',
  APP_TITLE: 'Quản lý dự án',
  ENABLE_PROJECT_CARDS: true,
  ENABLE_EXPORT: true,
  ENABLE_SHARING: true,
  REQUEST_TIMEOUT: 30000,
  DEBUG_MODE: false,
};

// Environment detection
const getEnvironment = (): string => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Check if running on Heroku
  if (hostname.includes('herokuapp.com')) {
    return 'production';
  }
  
  // Check if running on localhost with Docker
  if (hostname === 'localhost' && protocol === 'http:') {
    return 'local-production';
  }
  
  // Default to development
  return 'development';
};

// Get configuration based on environment
export const getConfig = (): EnvironmentConfig => {
  const env = getEnvironment();
  
  switch (env) {
    case 'production':
      return {
        ...productionConfig,
        API_URL: process.env.REACT_APP_API_URL || productionConfig.API_URL,
        SOCKET_URL: process.env.REACT_APP_SOCKET_URL || productionConfig.SOCKET_URL,
        APP_TITLE: process.env.REACT_APP_TITLE || productionConfig.APP_TITLE,
      };
    case 'local-production':
      return {
        ...localProductionConfig,
        API_URL: process.env.REACT_APP_API_URL || localProductionConfig.API_URL,
        SOCKET_URL: process.env.REACT_APP_SOCKET_URL || localProductionConfig.SOCKET_URL,
        APP_TITLE: process.env.REACT_APP_TITLE || localProductionConfig.APP_TITLE,
      };
    default:
      return {
        ...developmentConfig,
        API_URL: process.env.REACT_APP_API_URL || developmentConfig.API_URL,
        SOCKET_URL: process.env.REACT_APP_SOCKET_URL || developmentConfig.SOCKET_URL,
        APP_TITLE: process.env.REACT_APP_TITLE || developmentConfig.APP_TITLE,
      };
  }
};

// Export current configuration
export const config = getConfig();

// Environment info for debugging
export const environmentInfo = {
  current: getEnvironment(),
  config,
  hostname: window.location.hostname,
  protocol: window.location.protocol,
  port: window.location.port,
  fullUrl: window.location.href,
};

// Log environment info in development
if (config.DEBUG_MODE) {
  console.log('🌍 Environment Info:', environmentInfo);
  console.log('⚙️ Current Config:', config);
} 