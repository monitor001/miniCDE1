// Simulate the frontend environment configuration
const getEnvironment = () => {
  const hostname = 'minicde-production-589be4b0d52b.herokuapp.com';
  const protocol = 'https:';
  
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

// Production Environment (Heroku)
const productionConfig = {
  API_URL: 'https://minicde-production-589be4b0d52b.herokuapp.com/api',
  SOCKET_URL: 'https://minicde-production-589be4b0d52b.herokuapp.com',
  APP_TITLE: 'Quản lý dự án',
  ENABLE_PROJECT_CARDS: true,
  ENABLE_EXPORT: true,
  ENABLE_SHARING: true,
  REQUEST_TIMEOUT: 30000,
  DEBUG_MODE: false,
};

// Get configuration based on environment
const getConfig = () => {
  const env = getEnvironment();
  
  switch (env) {
    case 'production':
      return {
        ...productionConfig,
        API_URL: process.env.REACT_APP_API_URL || productionConfig.API_URL,
        SOCKET_URL: process.env.REACT_APP_SOCKET_URL || productionConfig.SOCKET_URL,
        APP_TITLE: process.env.REACT_APP_TITLE || productionConfig.APP_TITLE,
      };
    default:
      return productionConfig;
  }
};

// Simulate the environment variable
process.env.REACT_APP_API_URL = 'https://minicde-production-589be4b0d52b.herokuapp.com/api';

const config = getConfig();

console.log('🔍 Frontend Environment Configuration Test');
console.log('==========================================');
console.log('📍 Environment detected:', getEnvironment());
console.log('🔧 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('⚙️ Final API_URL:', config.API_URL);
console.log('🔗 Login URL would be:', config.API_URL + '/auth/login');
console.log('');

// Test what the actual URL would be
const axiosInstance = {
  baseURL: config.API_URL,
  post: (url, data) => {
    const fullUrl = config.API_URL + url;
    console.log('🚀 Simulated API call:');
    console.log('   Base URL:', config.API_URL);
    console.log('   Endpoint:', url);
    console.log('   Full URL:', fullUrl);
    return Promise.resolve({ status: 200, data: { success: true } });
  }
};

// Simulate the login call
axiosInstance.post('/auth/login', { email: 'test@example.com', password: 'test' }); 