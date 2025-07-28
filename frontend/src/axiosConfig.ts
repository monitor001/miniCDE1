import axios from 'axios';
import { App } from 'antd';

// Base URL - support both development and production
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://minicde-production-589be4b0d52b.herokuapp.com/api'
    : 'http://localhost:3001/api'
  );

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: parseInt(process.env.REACT_APP_REQUEST_TIMEOUT || '30000'),
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
    
    // Add request timestamp for debugging
    (config as any).metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
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
      console.log(`API Request completed in ${duration}ms:`, response.config.url);
    }
    
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      // Handle different status codes
      switch (response.status) {
        case 401:
          // Unauthorized - clear token but don't redirect automatically
          console.log('401 Unauthorized - clearing auth data');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Don't redirect automatically, let components handle it
          console.error('Authentication failed. Please log in again.');
          break;
        
        case 403:
          // Forbidden
          console.error('You do not have permission to perform this action.');
          break;
        
        case 404:
          // Not found
          console.error('The requested resource was not found.');
          break;
        
        case 429:
          // Rate limited
          console.error('Too many requests. Please try again later.');
          break;
        
        case 500:
          // Server error
          console.error('An error occurred on the server. Please try again later.');
          break;
        
        case 503:
          // Service unavailable
          console.error('Service temporarily unavailable. Please try again later.');
          break;
        
        default:
          // Other errors
          if (response.data && response.data.error) {
            console.error(response.data.error);
          } else {
            console.error('An unexpected error occurred.');
          }
      }
    } else {
      // Network error
      console.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 