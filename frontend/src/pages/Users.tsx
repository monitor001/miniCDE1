import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, DatePicker } from 'antd';
import axiosInstance from '../axiosConfig';
import { useOutletContext } from 'react-router-dom';
import moment from 'moment';

const { Option } = Select;

const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();
  const outletContext = useOutletContext<{ role?: string }>() || {};
  const role = outletContext.role || '';
  const [filter, setFilter] = useState<{
    name: string;
    email: string;
    role: string;
    createdAt: any;
  }>({
    name: '',
    email: '',
    role: '',
    createdAt: null
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/users');
      console.log('User data response:', res.data);
      if (res.data && Array.isArray(res.data)) {
        setUsers(res.data);
      } else if (res.data && res.data.users && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      } else {
        console.error('Invalid users data format:', res.data);
        message.error('Dữ liệu người dùng không đúng định dạng!');
        setUsers([]);
      }
    } catch (e) {
      console.error('Lỗi fetchUsers:', e);
      message.error('Không thể tải danh sách người dùng!');
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleEdit = (record: any) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await axiosInstance.delete(`/users/${id}`);
    message.success('Đã xóa người dùng');
    fetchUsers();
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('Submit user values:', values);
      
      // Định dạng dữ liệu trước khi gửi - chỉ giữ các trường cần thiết
      const requestData: any = {
        name: values.name?.trim(),
        email: values.email?.trim().toLowerCase(),
        role: values.role
      };
      
      // Chỉ thêm password khi tạo mới hoặc khi có nhập password
      if (!editingUser || values.password) {
        requestData.password = values.password;
      }
      
      console.log('Sending user data to server:', requestData);
      
      if (editingUser) {
        const response = await axiosInstance.put(`/users/${editingUser.id}`, requestData);
        console.log('User update response:', response.data);
        message.success('Đã cập nhật người dùng');
      } else {
        const response = await axiosInstance.post('/auth/register', requestData);
        console.log('User create response:', response.data);
        message.success('Đã thêm người dùng');
      }
      
      setModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (e: any) {
      console.error('Error submitting user form:', e);
      
      // Xử lý lỗi validation form
      if (e.errorFields) {
        console.log('Form validation errors:', e.errorFields);
        const errorMessages = e.errorFields.map((field: any) => field.errors[0]).join(', ');
        message.error(`Lỗi validation: ${errorMessages}`);
        return;
      }
      
      // Xử lý lỗi từ server
      if (e.response) {
        console.log('Server response status:', e.response.status);
        console.log('Server response data:', e.response.data);
        message.error(e.response.data?.error || 'Lỗi server');
      } else {
        message.error(e?.message || 'Lỗi không xác định');
      }
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user =>
    (!filter.name || user.name.toLowerCase().includes(filter.name.toLowerCase())) &&
    (!filter.email || user.email.toLowerCase().includes(filter.email.toLowerCase())) &&
    (!filter.role || user.role === filter.role) &&
    (!filter.createdAt || moment(user.createdAt).isSame(filter.createdAt, 'day'))
  ) : [];
  
  const columns = [
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Tài khoản', dataIndex: 'email', key: 'email' },
    { title: 'Mật khẩu', dataIndex: 'password', key: 'password', render: () => '••••••••' },
    { title: 'Quyền', dataIndex: 'role', key: 'role' },
    {
      title: 'Sửa', key: 'edit', render: (_: any, record: any) => (
        <Button type="primary" onClick={() => handleEdit(record)} icon={<span className="anticon">✏️</span>} size="small" />
      )
    },
    {
      title: 'Xóa', key: 'delete', render: (_: any, record: any) => (
        <Popconfirm title="Xóa người dùng này?" onConfirm={() => handleDelete(record.id)}>
          <Button type="primary" danger icon={<span className="anticon">🗑️</span>} size="small" />
        </Popconfirm>
      )
    }
  ];
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Input placeholder="Tìm tên" style={{ width: 160 }} value={filter.name} onChange={e => setFilter(f => ({ ...f, name: e.target.value }))} />
        <Input placeholder="Tìm email" style={{ width: 180 }} value={filter.email} onChange={e => setFilter(f => ({ ...f, email: e.target.value }))} />
        <Select placeholder="Vai trò" style={{ width: 120 }} allowClear value={filter.role || undefined} onChange={v => setFilter(f => ({ ...f, role: v || '' }))}>
          <Option value="ADMIN">Admin</Option>
          <Option value="USER">User</Option>
          <Option value="PROJECT_MANAGER">Project Manager</Option>
          <Option value="BIM_MANAGER">BIM Manager</Option>
        </Select>
        <DatePicker placeholder="Ngày tạo" style={{ width: 140 }} value={filter.createdAt} onChange={d => setFilter(f => ({ ...f, createdAt: d }))} />
        <Button onClick={() => setFilter({ name: '', email: '', role: '', createdAt: null })}>Xóa lọc</Button>
        <Button type="primary" onClick={handleAdd} icon={<span className="anticon">+</span>}>Thêm người dùng</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={filteredUsers} loading={loading} bordered />
      <Modal open={modalOpen} title={editingUser ? 'Sửa người dùng' : 'Thêm người dùng'} onOk={handleOk} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item 
            name="name" 
            label="Tên" 
            rules={[
              { required: true, message: 'Nhập tên!' },
              { whitespace: true, message: 'Tên không được để trống!' }
            ]}
          > 
            <Input placeholder="Nhập tên" /> 
          </Form.Item>
          <Form.Item 
            name="email" 
            label="Tài khoản" 
            rules={[
              { required: true, message: 'Nhập tài khoản!' },
              { type: 'email', message: 'Email không đúng định dạng!' },
              { whitespace: true, message: 'Email không được để trống!' }
            ]}
          > 
            <Input placeholder="Nhập email" /> 
          </Form.Item>
          <Form.Item 
            name="password" 
            label="Mật khẩu" 
            rules={[
              { required: !editingUser, message: 'Nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
          > 
            <Input.Password placeholder="Nhập mật khẩu" /> 
          </Form.Item>
          <Form.Item 
            name="role" 
            label="Quyền" 
            rules={[
              { required: true, message: 'Chọn quyền!' }
            ]}
          > 
            <Select placeholder="Chọn quyền">
              <Option value="ADMIN">Quản trị viên</Option>
              <Option value="USER">Cấp nhân viên</Option>
              <Option value="PROJECT_MANAGER">Quản lý dự án</Option>
              <Option value="BIM_MANAGER">Quản lý BIM</Option>
            </Select> 
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users; 