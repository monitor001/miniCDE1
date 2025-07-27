import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';
import store from './store';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Project from './pages/Project';
import ProjectsNew from './pages/ProjectsNew';
import ProjectDetail from './pages/ProjectDetail';
import DocumentsISO from './pages/DocumentsISO';
import DocumentDetail from './pages/DocumentDetail';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Issues from './pages/Issues';
import CalendarPage from './pages/CalendarPage';

import Reports from './pages/Reports';
import IssueDetail from './pages/IssueDetail';
import Notes from './pages/Notes';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Auth guard component
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('PrivateRoute check:', { 
    hasToken: !!token, 
    hasUser: !!user,
    token: token ? `${token.substring(0, 20)}...` : 'null',
    user: user ? JSON.parse(user).name : 'null'
  });
  
  if (!token) {
    console.log('No token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (!user) {
    console.log('No user found, redirecting to login');
    localStorage.removeItem('token'); // Clear invalid token
    return <Navigate to="/login" replace />;
  }
  
  try {
    const userData = JSON.parse(user);
    if (!userData.id || !userData.email) {
      console.log('Invalid user data, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    console.log('Error parsing user data, redirecting to login');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
  
  console.log('Authentication valid, rendering protected route');
  return <>{children}</>;
};

// Admin guard component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const userData = JSON.parse(user);
    if (userData.role !== 'ADMIN') {
      console.log('User is not admin, redirecting to dashboard');
      return <Navigate to="/" replace />;
    }
  } catch (error) {
    console.log('Error parsing user data, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const { i18n } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && 
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  // Update theme when system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('theme') !== 'light' && localStorage.getItem('theme') !== 'dark') {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update language based on localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
              colorPrimary: '#1890ff',
            },
          }}
        >
          <AntdApp>
            <Router>
              <Routes>
                {/* Auth routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                </Route>

                {/* Protected routes */}
                <Route element={<MainLayout setIsDarkMode={setIsDarkMode} isDarkMode={isDarkMode} />}>
                  <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  
                  <Route path="/projects" element={<PrivateRoute><ProjectsNew /></PrivateRoute>} />
                  <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
                  
                  <Route path="/documents-iso" element={<PrivateRoute><DocumentsISO /></PrivateRoute>} />
                  <Route path="/documents/:id" element={<PrivateRoute><DocumentDetail /></PrivateRoute>} />
                  
                  <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
                  <Route path="/tasks/:id" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
                  
                  <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
                  <Route path="/users/:id" element={<AdminRoute><UserDetail /></AdminRoute>} />
                  
                  <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                  <Route path="/issues" element={<PrivateRoute><Issues /></PrivateRoute>} />
                  <Route path="/issues/:id" element={<PrivateRoute><IssueDetail /></PrivateRoute>} />
                  <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
                  <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
                  <Route path="/notes" element={<Notes />} />
                </Route>

                {/* Not found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </AntdApp>
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
