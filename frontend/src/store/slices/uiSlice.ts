import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'vi';
  loading: {
    [key: string]: boolean;
  };
}

const initialState: UiState = {
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system',
  language: (localStorage.getItem('language') as 'en' | 'vi') || 'en',
  loading: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(state.sidebarCollapsed));
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('sidebarCollapsed', String(action.payload));
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setLanguage: (state, action: PayloadAction<'en' | 'vi'>) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.isLoading;
    },
  },
});

export const { 
  toggleSidebar, 
  setSidebarCollapsed, 
  setTheme, 
  setLanguage, 
  setLoading 
} = uiSlice.actions;

export default uiSlice.reducer; 