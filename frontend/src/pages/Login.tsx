import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Typography, Divider, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { login, verifyTwoFactor, clearError } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { isLoading, error, requireTwoFactor, tempUserId, token } = useSelector(
    (state: RootState) => state.auth
  );
  
  const [form] = Form.useForm();
  const [twoFactorForm] = Form.useForm();
  
  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);
  
  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);
  
  // Handle login form submission
  const handleLogin = async (values: { email: string; password: string; remember: boolean }) => {
    const { email, password, remember } = values;
    
    // Save email if remember is checked
    if (remember) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    
    await dispatch(login({ email, password }));
  };
  
  // Handle 2FA verification
  const handleVerify2FA = async (values: { code: string }) => {
    if (tempUserId) {
      await dispatch(verifyTwoFactor({ userId: tempUserId, token: values.code }));
    }
  };
  
  // Pre-fill email if remembered
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      form.setFieldsValue({ email: rememberedEmail, remember: true });
    }
  }, [form]);
  
  return (
    <div>
      {!requireTwoFactor ? (
        // Login form
        <>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
            {t('auth.login')}
          </Title>
          
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}
          
          <Form
            form={form}
            name="login"
            initialValues={{ remember: false }}
            onFinish={handleLogin}
            layout="vertical"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: t('errors.validation') },
                { type: 'email', message: t('errors.validation') }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder={t('auth.email')} 
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[{ required: true, message: t('errors.validation') }]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder={t('auth.password')} 
                size="large"
              />
            </Form.Item>
            
            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>{t('auth.rememberMe')}</Checkbox>
                </Form.Item>
                <a href="#forgot-password">
                  {t('auth.forgotPassword')}
                </a>
              </div>
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={isLoading}
                block
                size="large"
              >
                {t('auth.login')}
              </Button>
            </Form.Item>
          </Form>
        </>
      ) : (
        // 2FA verification form
        <>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
            {t('auth.twoFactorAuth')}
          </Title>
          
          <Text style={{ display: 'block', marginBottom: 24 }}>
            {t('auth.twoFactorCode')}
          </Text>
          
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}
          
          <Form
            form={twoFactorForm}
            name="2fa"
            onFinish={handleVerify2FA}
            layout="vertical"
          >
            <Form.Item
              name="code"
              rules={[{ required: true, message: t('errors.validation') }]}
            >
              <Input 
                prefix={<KeyOutlined />} 
                placeholder="000000" 
                size="large"
                maxLength={6}
                autoComplete="off"
              />
            </Form.Item>
            
            <Form.Item>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={isLoading}
                  block
                  size="large"
                >
                  {t('auth.verify')}
                </Button>
                
                <Button 
                  type="link" 
                  onClick={() => dispatch(clearError())}
                  block
                >
                  {t('common.back')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </>
      )}
      
      <Divider />
      
      <div style={{ textAlign: 'center' }}>
        <Text type="secondary">
          {t('app.tagline')}
        </Text>
      </div>
    </div>
  );
};

export default Login; 