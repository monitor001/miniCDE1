import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import projectReducer from './slices/projectSlice';
import documentReducer from './slices/documentSlice';
import taskReducer from './slices/taskSlice';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    documents: documentReducer,
    tasks: taskReducer,
    users: userReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/login/fulfilled', 'auth/refreshToken/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.token', 'payload.user'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.user', 'auth.token'],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store; 