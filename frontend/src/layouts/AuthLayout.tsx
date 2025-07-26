import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, Typography, Select, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setLanguage } from '../store/slices/uiSlice';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const AuthLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { token } = theme.useToken();
  
  // Handle language change
  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    dispatch(setLanguage(value as 'en' | 'vi'));
  };
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: token.colorBgContainer,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
      }}>
        <Title level={4} style={{ margin: 0 }}>
          {t('app.name')}
        </Title>
        <Select
          defaultValue={i18n.language}
          style={{ width: 120 }}
          onChange={handleLanguageChange}
        >
          <Option value="en">English</Option>
          <Option value="vi">Tiếng Việt</Option>
        </Select>
      </Header>
      
      <Content style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '50px 24px'
      }}>
        <div style={{
          maxWidth: 400,
          width: '100%',
          padding: 24,
          borderRadius: 8,
          background: token.colorBgContainer,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }}>
          <Outlet />
        </div>
      </Content>
      
      <Footer style={{ 
        textAlign: 'center',
        background: token.colorBgContainer,
        borderTop: `1px solid ${token.colorBorderSecondary}`
      }}>
        <Text type="secondary">
          {t('app.name')} &copy; {new Date().getFullYear()} - {t('app.tagline')}
        </Text>
      </Footer>
    </Layout>
  );
};

export default AuthLayout; 