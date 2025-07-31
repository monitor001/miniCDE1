import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Typography, Card, Tabs, Button, Space, Tag, Descriptions, 
  Table, Modal, Form, Input, Select, Spin, Popconfirm, message,
  Switch
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, LockOutlined, 
  ProjectOutlined, FileOutlined, UserOutlined
} from '@ant-design/icons';
import { fetchUserById, updateUser, deleteUser } from '../store/slices/userSlice';
import { RootState } from '../store';
import type { TabsProps } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

const UserDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentUser, isLoading, error } = useSelector((state: RootState) => state.users as any);
  const { user: loggedInUser } = useSelector((state: RootState) => state.auth);
  
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  
  // Fetch user data
  useEffect(() => {
    if (id) {
      dispatch(fetchUserById(id) as any);
    }
  }, [dispatch, id]);
  
  // Set form values when user data is loaded
  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        organization: currentUser.organization,
        twoFactorEnabled: currentUser.twoFactorEnabled
      });
    }
  }, [currentUser, form]);
  
  if (isLoading) {
    return <Spin size="large" />;
  }
  
  if (error) {
    return <div>{error}</div>;
  }
  
  if (!currentUser) {
    return <div>{t('users.notFound')}</div>;
  }
  
  // Handle user update
  const handleUpdateUser = async (values: any) => {
    if (id) {
      await dispatch(updateUser({ id, data: values }) as any);
      setIsEditModalVisible(false);
      message.success(t('users.updateSuccess'));
    }
  };
  
  // Handle password change
  const handlePasswordChange = async (values: any) => {
    if (id) {
      await dispatch(updateUser({ id, data: { password: values.password } as any }) as any);
      setIsPasswordModalVisible(false);
      passwordForm.resetFields();
      message.success(t('users.passwordSuccess'));
    }
  };
  
  // Handle user delete
  const handleDeleteUser = async () => {
    if (id) {
      await dispatch(deleteUser(id) as any);
      navigate('/users');
      message.success(t('users.deleteSuccess'));
    }
  };
  
  // User role tag color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'red';
      case 'MANAGER':
        return 'gold';
      case 'USER':
        return 'green';
      default:
        return 'default';
    }
  };
  
  // Tab items
  const items: TabsProps['items'] = [
    {
      key: 'overview',
      label: t('users.tabs.overview'),
      children: (
        <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}>
          <Descriptions.Item label={t('users.name')}>{currentUser.name}</Descriptions.Item>
          <Descriptions.Item label={t('users.email')}>{currentUser.email}</Descriptions.Item>
          <Descriptions.Item label={t('users.role')}>
            <Tag color={getRoleColor(currentUser.role)}>{currentUser.role}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('users.organization')}>
            {currentUser.organization || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('users.twoFactorEnabled')}>
            {currentUser.twoFactorEnabled ? t('common.yes') : t('common.no')}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.createdAt')}>
            {new Date(currentUser.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.updatedAt')}>
            {new Date(currentUser.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'projects',
      label: t('users.tabs.projects'),
      children: (
        <Table 
          dataSource={[]} // This would be populated from API
          rowKey="id"
          columns={[
            {
              title: t('projects.name'),
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: t('projects.status'),
              dataIndex: 'status',
              key: 'status',
              render: (status) => {
                let color = 'default';
                if (status === 'ACTIVE') color = 'green';
                if (status === 'COMPLETED') color = 'blue';
                if (status === 'ON_HOLD') color = 'orange';
                if (status === 'CANCELLED') color = 'red';
                
                return <Tag color={color}>{status}</Tag>;
              },
            },
            {
              title: t('projects.role'),
              dataIndex: 'role',
              key: 'role',
              render: (role) => {
                let color = 'default';
                if (role === 'OWNER') color = 'gold';
                if (role === 'ADMIN') color = 'red';
                if (role === 'EDITOR') color = 'green';
                if (role === 'VIEWER') color = 'blue';
                
                return <Tag color={color}>{role}</Tag>;
              },
            },
            {
              title: t('common.actions'),
              key: 'actions',
              render: (_, record: any) => (
                <Button 
                  size="small" 
                  icon={<ProjectOutlined />}
                  onClick={() => navigate(`/projects/${record.id}`)}
                />
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'tasks',
      label: t('users.tabs.tasks'),
      children: (
        <Table 
          dataSource={[]} // This would be populated from API
          rowKey="id"
          columns={[
            {
              title: t('tasks.title'),
              dataIndex: 'title',
              key: 'title',
            },
            {
              title: t('tasks.status'),
              dataIndex: 'status',
              key: 'status',
              render: (status) => {
                let color = 'default';
                if (status === 'TODO') color = 'default';
                if (status === 'IN_PROGRESS') color = 'processing';
                if (status === 'REVIEW') color = 'warning';
                if (status === 'DONE') color = 'success';
                
                return <Tag color={color}>{status}</Tag>;
              },
            },
            {
              title: t('tasks.priority'),
              dataIndex: 'priority',
              key: 'priority',
              render: (priority) => {
                let color = 'default';
                if (priority === 'LOW') color = 'blue';
                if (priority === 'MEDIUM') color = 'orange';
                if (priority === 'HIGH') color = 'red';
                
                return <Tag color={color}>{priority}</Tag>;
              },
            },
            {
              title: t('tasks.dueDate'),
              dataIndex: 'dueDate',
              key: 'dueDate',
              render: (date) => date ? new Date(date).toLocaleDateString() : '-',
            },
            {
              title: t('common.actions'),
              key: 'actions',
              render: (_, record: any) => (
                <Button 
                  size="small" 
                  icon={<FileOutlined />}
                  onClick={() => navigate(`/tasks/${record.id}`)}
                />
              ),
            },
          ]}
        />
      ),
    },
  ];
  
  // Check if current user can edit this user
  const canEdit = loggedInUser?.role === 'ADMIN' || loggedInUser?.id === id;
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>
          <UserOutlined style={{ marginRight: 8 }} />
          {currentUser.name}
        </Title>
        {canEdit && (
          <Space>
            <Button 
              icon={<LockOutlined />} 
              onClick={() => setIsPasswordModalVisible(true)}
            >
              {t('users.changePassword')}
            </Button>
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => setIsEditModalVisible(true)}
            >
              {t('common.edit')}
            </Button>
            {loggedInUser?.role === 'ADMIN' && loggedInUser?.id !== id && (
              <Popconfirm
                title={t('users.confirmDelete')}
                onConfirm={handleDeleteUser}
                okText={t('common.yes')}
                cancelText={t('common.no')}
              >
                <Button danger icon={<DeleteOutlined />}>
                  {t('common.delete')}
                </Button>
              </Popconfirm>
            )}
          </Space>
        )}
      </div>
      
      <Card>
        <Tabs defaultActiveKey="overview" items={items} />
      </Card>
      
      {/* Edit User Modal */}
      <Modal
        title={t('users.edit')}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateUser}
        >
          <Form.Item
            name="name"
            label={t('users.name')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label={t('users.email')}
            rules={[
              { required: true, message: t('validation.required') },
              { type: 'email', message: t('validation.email') }
            ]}
          >
            <Input />
          </Form.Item>
          {loggedInUser?.role === 'ADMIN' && (
            <Form.Item
              name="role"
              label={t('users.role')}
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <Select>
                <Option value="ADMIN">{t('roles.admin')}</Option>
                <Option value="MANAGER">{t('roles.manager')}</Option>
                <Option value="USER">{t('roles.user')}</Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item
            name="organization"
            label={t('users.organization')}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="twoFactorEnabled"
            label={t('users.twoFactorEnabled')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {t('common.save')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Change Password Modal */}
      <Modal
        title={t('users.changePassword')}
        open={isPasswordModalVisible}
        onCancel={() => {
          setIsPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          {loggedInUser?.id === id && (
            <Form.Item
              name="currentPassword"
              label={t('users.currentPassword')}
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item
            name="password"
            label={t('users.newPassword')}
            rules={[
              { required: true, message: t('validation.required') },
              { min: 8, message: t('validation.passwordLength') }
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('users.confirmPassword')}
            dependencies={['password']}
            rules={[
              { required: true, message: t('validation.required') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('validation.passwordMatch')));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {t('common.save')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserDetail; 