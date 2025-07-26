import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Layout, Menu, Button, Dropdown, Avatar, Typography, Space, Badge, Drawer, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ProjectOutlined,
  FileOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  GlobalOutlined,
  BulbOutlined,
  CheckSquareOutlined
} from '@ant-design/icons';

import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { toggleSidebar, setLanguage, setTheme } from '../store/slices/uiSlice';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ isDarkMode, setIsDarkMode }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = theme.useToken();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui);
  
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState<boolean>(false);
  const [notificationsVisible, setNotificationsVisible] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Get current path for menu selection
  const currentPath = location.pathname.split('/')[1] || 'dashboard';
  
  // Handle logout
  const handleLogout = () => {
    dispatch(logout() as any);
    navigate('/login');
  };
  
  // Handle language change
  const handleLanguageChange = (lang: 'en' | 'vi') => {
    i18n.changeLanguage(lang);
    dispatch(setLanguage(lang));
  };
  
  // Handle theme change
  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    if (mode === 'light') {
      setIsDarkMode(false);
    } else if (mode === 'dark') {
      setIsDarkMode(true);
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
    dispatch(setTheme(mode));
  };
  
  // Toggle sidebar
  const toggle = () => {
    dispatch(toggleSidebar());
  };
  
  // Fetch notifications
  useEffect(() => {
    // Mock notifications
    setNotifications([
      {
        id: 1,
        title: 'New document uploaded',
        message: 'John Doe uploaded a new document',
        time: '10 minutes ago',
        read: false
      },
      {
        id: 2,
        title: 'Task assigned',
        message: 'You have been assigned a new task',
        time: '1 hour ago',
        read: false
      },
      {
        id: 3,
        title: 'Project update',
        message: 'Project status has been updated',
        time: '2 hours ago',
        read: true
      }
    ]);
  }, []);
  
  // Menu items
  const menuItems = [
    {
      key: '',
      icon: <DashboardOutlined />,
      label: t('navigation.dashboard'),
      onClick: () => navigate('/')
    },
    {
      key: 'projects',
      icon: <ProjectOutlined />,
      label: t('navigation.projects'),
      onClick: () => navigate('/projects')
    },
    {
      key: 'documents',
      icon: <FileOutlined />,
      label: t('navigation.documents'),
      onClick: () => navigate('/documents')
    },
    {
      key: 'tasks',
      icon: <CheckSquareOutlined />,
      label: t('navigation.tasks'),
      onClick: () => navigate('/tasks')
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: t('navigation.users'),
      onClick: () => navigate('/users')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('navigation.settings'),
      onClick: () => navigate('/settings')
    }
  ];
  
  // User dropdown menu
  const userMenu: MenuProps = {
    items: [
      {
        key: '1',
        icon: <UserOutlined />,
        label: t('settings.profile'),
        onClick: () => navigate('/settings')
      },
      {
        key: '2',
        icon: <LogoutOutlined />,
        label: t('auth.logout'),
        onClick: handleLogout
      }
    ]
  };
  
  // Language dropdown menu
  const languageMenu: MenuProps = {
    items: [
      {
        key: 'en',
        label: 'English',
        onClick: () => handleLanguageChange('en')
      },
      {
        key: 'vi',
        label: 'Tiếng Việt',
        onClick: () => handleLanguageChange('vi')
      }
    ]
  };
  
  // Theme dropdown menu
  const themeMenu: MenuProps = {
    items: [
      {
        key: 'light',
        label: t('settings.theme.light'),
        onClick: () => handleThemeChange('light')
      },
      {
        key: 'dark',
        label: t('settings.theme.dark'),
        onClick: () => handleThemeChange('dark')
      },
      {
        key: 'system',
        label: t('settings.theme.system'),
        onClick: () => handleThemeChange('system')
      }
    ]
  };
  
  // Notification dropdown
  const notificationMenu: MenuProps = {
    items: notifications.map(notification => ({
      key: notification.id,
      label: (
        <div>
          <Text strong>{notification.title}</Text>
          <br />
          <Text type="secondary">{notification.message}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{notification.time}</Text>
        </div>
      )
    }))
  };
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        breakpoint="lg"
        collapsedWidth={80}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000
        }}
        theme={isDarkMode ? 'dark' : 'light'}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          padding: sidebarCollapsed ? 0 : '0 16px',
          color: token.colorPrimary,
          fontSize: 18,
          fontWeight: 'bold'
        }}>
          {!sidebarCollapsed && 'CDE BIM'}
          {sidebarCollapsed && 'CDE'}
        </div>
        <Menu
          theme={isDarkMode ? 'dark' : 'light'}
          mode="inline"
          defaultSelectedKeys={[currentPath]}
          items={menuItems}
        />
      </Sider>
      
      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileDrawerVisible(false)}
        open={mobileDrawerVisible}
        bodyStyle={{ padding: 0 }}
        title="CDE BIM"
      >
        <Menu
          theme={isDarkMode ? 'dark' : 'light'}
          mode="inline"
          defaultSelectedKeys={[currentPath]}
          items={menuItems}
        />
      </Drawer>
      
      <Layout style={{ 
        marginLeft: sidebarCollapsed ? 80 : 200, 
        transition: 'all 0.2s' 
      }}>
        <Header style={{ 
          padding: '0 16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          width: '100%',
          background: token.colorBgContainer,
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggle}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Space size="middle">
              <Dropdown menu={themeMenu} placement="bottomRight">
                <Button type="text" icon={<BulbOutlined />} />
              </Dropdown>
              
              <Dropdown menu={languageMenu} placement="bottomRight">
                <Button type="text" icon={<GlobalOutlined />} />
              </Dropdown>
              
              <Dropdown menu={notificationMenu} placement="bottomRight">
                <Badge count={notifications.filter(n => !n.read).length} size="small">
                  <Button type="text" icon={<BellOutlined />} />
                </Badge>
              </Dropdown>
              
              <Dropdown menu={userMenu} placement="bottomRight">
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <span>{user?.name}</span>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content style={{ margin: '24px 16px', padding: 24, background: token.colorBgContainer, borderRadius: 4 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 