import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Switch, Typography, message, Divider } from 'antd';
import axios from 'axios';

const { Title } = Typography;

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchMe = async () => {
      const res = await axios.get('/api/users/me');
      const userData = res.data as any;
      if (userData && typeof userData === 'object') {
        setUser(userData);
        form.setFieldsValue({ name: userData.name, email: userData.email });
      }
    };
    fetchMe();
  }, [form]);

  const handleProfile = async (values: any) => {
    setLoading(true);
    try {
      await axios.put('/api/users/me', values);
      message.success('Đã cập nhật thông tin cá nhân!');
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Lỗi cập nhật!');
    }
    setLoading(false);
  };

  const handlePassword = async (values: any) => {
    setLoading(true);
    try {
      await axios.post('/api/users/change-password', values);
      message.success('Đổi mật khẩu thành công!');
      pwdForm.resetFields();
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Lỗi đổi mật khẩu!');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto' }}>
      <Card>
        <Title level={3}>Cài đặt cá nhân</Title>
        <Form form={form} layout="vertical" onFinish={handleProfile} style={{ marginBottom: 24 }}>
          <Form.Item name="name" label="Tên cá nhân" rules={[{ required: true, message: 'Nhập tên!' }]}> <Input /> </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Nhập email!' }]}> <Input /> </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Lưu thay đổi</Button>
          </Form.Item>
        </Form>
        <Divider />
        <Title level={5}>Đổi mật khẩu</Title>
        <Form form={pwdForm} layout="vertical" onFinish={handlePassword}>
          <Form.Item name="oldPassword" label="Mật khẩu cũ" rules={[{ required: true, message: 'Nhập mật khẩu cũ!' }]}> <Input.Password /> </Form.Item>
          <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true, message: 'Nhập mật khẩu mới!' }]}> <Input.Password /> </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Đổi mật khẩu</Button>
          </Form.Item>
        </Form>
        <Divider />
        <Form.Item name="theme" label="Giao diện" valuePropName="checked">
          <Switch checkedChildren="Tối" unCheckedChildren="Sáng" />
        </Form.Item>
      </Card>
    </div>
  );
};

export default Settings; 