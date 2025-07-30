import axios from 'axios';
import { App } from 'antd';
import { config } from './config/environment';

// Create axios instance with environment-aware configuration
const axiosInstance = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: config.REQUEST_TIMEOUT,
  withCredentials: true, // Enable cookies for CORS
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CORS headers for cross-origin requests
    if (process.env.NODE_ENV === 'development') {
      config.headers['Access-Control-Allow-Origin'] = '*';
      config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      config.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    }
    
    // Add request timestamp for debugging
    (config as any).metadata = { startTime: new Date() };
    
    // Log request in debug mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        headers: config.headers,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response time for debugging
    const endTime = new Date();
    const startTime = (response.config as any).metadata?.startTime;
    if (startTime) {
      const duration = endTime.getTime() - startTime.getTime();
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ API Response (${duration}ms): ${response.config.url}`, response.data);
      }
    }
    
    return response;
  },
  (error) => {
    const { response, request, message } = error;
    
    // Log error details
    console.error('❌ API Error:', {
      status: response?.status,
      statusText: response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: message,
      data: response?.data,
    });
    
    if (response) {
      // Handle different status codes
      switch (response.status) {
        case 401:
          // Unauthorized - clear token but don't redirect automatically
          console.log('🔐 401 Unauthorized - clearing auth data');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Don't redirect automatically, let components handle it
          console.error('Authentication failed. Please log in again.');
          break;
        
        case 403:
          // Forbidden
          console.error('🚫 You do not have permission to perform this action.');
          break;
        
        case 404:
          // Not found
          console.error('🔍 The requested resource was not found.');
          break;
        
        case 429:
          // Rate limited
          console.error('⏰ Too many requests. Please try again later.');
          break;
        
        case 500:
          // Server error
          console.error('💥 An error occurred on the server. Please try again later.');
          break;
        
        case 503:
          // Service unavailable
          console.error('🔧 Service temporarily unavailable. Please try again later.');
          // Show user-friendly message
          if (window.location.hostname.includes('herokuapp.com')) {
            console.error('Heroku service is currently unavailable. Please try again in a few minutes.');
          }
          break;
        
        default:
          // Other errors
          if (response.data && response.data.error) {
            console.error('❌ Server Error:', response.data.error);
          } else {
            console.error('❌ An unexpected error occurred.');
          }
      }
    } else if (request) {
      // Network error (no response received)
      console.error('🌐 Network error. Please check your connection.');
      
      // Check if it's a CORS error
      if (message.includes('Network Error') || message.includes('CORS')) {
        console.error('🔄 CORS Error detected. This might be due to:');
        console.error('   - Backend server is not running');
        console.error('   - CORS configuration is incorrect');
        console.error('   - Protocol mismatch (HTTP vs HTTPS)');
        console.error('   - Port mismatch');
        
        // Show helpful message based on environment
        const currentEnv = window.location.hostname;
        if (currentEnv === 'localhost') {
          console.error('💡 For localhost, make sure:');
          console.error('   - Backend is running on http://localhost:3001');
          console.error('   - Frontend is running on http://localhost:3000');
        } else if (currentEnv.includes('herokuapp.com')) {
          console.error('💡 For Heroku, make sure:');
          console.error('   - Heroku app is running');
          console.error('   - Environment variables are set correctly');
        }
      }
    } else {
      // Other errors
      console.error('❌ An unexpected error occurred:', message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 