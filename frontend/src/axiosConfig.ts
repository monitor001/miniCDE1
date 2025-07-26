import axios from 'axios';
import { message } from 'antd';

// Base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
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
          message.error('Authentication failed. Please log in again.');
          break;
        
        case 403:
          // Forbidden
          message.error('You do not have permission to perform this action.');
          break;
        
        case 404:
          // Not found
          message.error('The requested resource was not found.');
          break;
        
        case 500:
          // Server error
          message.error('An error occurred on the server. Please try again later.');
          break;
        
        default:
          // Other errors
          if (response.data && response.data.error) {
            message.error(response.data.error);
          } else {
            message.error('An unexpected error occurred.');
          }
      }
    } else {
      // Network error
      message.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 