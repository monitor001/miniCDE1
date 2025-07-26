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
import ProjectDetail from './pages/ProjectDetail';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

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
  return token ? <>{children}</> : <Navigate to="/login" replace />;
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
                  
                  <Route path="/projects" element={<PrivateRoute><Project /></PrivateRoute>} />
                  <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
                  
                  <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
                  <Route path="/documents/:id" element={<PrivateRoute><DocumentDetail /></PrivateRoute>} />
                  
                  <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
                  <Route path="/tasks/:id" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
                  
                  <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
                  <Route path="/users/:id" element={<PrivateRoute><UserDetail /></PrivateRoute>} />
                  
                  <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
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
