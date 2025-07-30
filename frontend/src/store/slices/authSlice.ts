import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../axiosConfig';
import { jwtDecode } from 'jwt-decode';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organization?: string;
  twoFactorEnabled?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  requireTwoFactor: boolean;
  tempUserId: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
  requireTwoFactor?: boolean;
  userId?: string;
}

interface TwoFactorVerifyData {
  userId: string;
  token: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  organization?: string;
}

// Initial state
const initialState: AuthState = {
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,
  requireTwoFactor: false,
  tempUserId: null,
};

// Async thunks
export const login = createAsyncThunk<LoginResponse, LoginCredentials>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('Attempting login with:', credentials);
      const response = await axiosInstance.post('/api/auth/login', credentials);
      console.log('Login response:', response.data);
      
      // Check if 2FA is required
      if (response.data.requireTwoFactor) {
        return {
          user: {} as User,
          token: '',
          requireTwoFactor: true,
          userId: response.data.userId,
        };
      }
      
      // Store token and user in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error);
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const verifyTwoFactor = createAsyncThunk<LoginResponse, TwoFactorVerifyData>(
  'auth/verifyTwoFactor',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/auth/verify-2fa', data);
      
      // Store token and user in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Two-factor verification failed');
    }
  }
);

export const register = createAsyncThunk<LoginResponse, RegisterData>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/auth/register', data);
      
      // Store token and user in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return true;
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState() as { auth: AuthState };
    
    if (!auth.token) {
      return rejectWithValue('No token available');
    }
    
    try {
      // Check if token is expired
      const decodedToken: any = jwtDecode(auth.token);
      const currentTime = Date.now() / 1000;
      
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        // Token is expired, try to refresh
        const response = await axiosInstance.post('/api/auth/refresh-token');
        
        // Store new token and user in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return response.data;
      }
      
      // Token is still valid
      return { token: auth.token, user: auth.user };
    } catch (error: any) {
      // Clear token and user from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return rejectWithValue(error.response?.data?.error || 'Token refresh failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      
      if (action.payload.requireTwoFactor) {
        state.requireTwoFactor = true;
        state.tempUserId = action.payload.userId || null;
      } else {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.requireTwoFactor = false;
        state.tempUserId = null;
      }
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Verify Two-Factor
    builder.addCase(verifyTwoFactor.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(verifyTwoFactor.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.requireTwoFactor = false;
      state.tempUserId = null;
    });
    builder.addCase(verifyTwoFactor.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Register
    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
    });
    
    // Refresh Token
    builder.addCase(refreshToken.fulfilled, (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    });
    builder.addCase(refreshToken.rejected, (state) => {
      state.user = null;
      state.token = null;
    });
  },
});

export const { clearError, updateUser } = authSlice.actions;

export default authSlice.reducer; 