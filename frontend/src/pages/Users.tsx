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
  const [filter, setFilter] = useState({ name: '', email: '', role: '', createdAt: null, code: '' });

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
      
      // Kiểm tra các trường bắt buộc
      if (!values.code) {
        message.error('Vui lòng nhập mã nhân sự!');
        return;
      }
      
      if (!values.name) {
        message.error('Vui lòng nhập tên!');
        return;
      }
      
      if (!values.email) {
        message.error('Vui lòng nhập tài khoản!');
        return;
      }
      
      if (!editingUser && !values.password) {
        message.error('Vui lòng nhập mật khẩu!');
        return;
      }
      
      if (!values.role) {
        message.error('Vui lòng chọn quyền!');
        return;
      }
      
      // Định dạng ngày sinh nếu có
      if (values.dob) {
        values.dob = values.dob.format('YYYY-MM-DD');
      }
      
      const requestData = { ...values };
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
      fetchUsers();
    } catch (e: any) {
      console.error('Error submitting user form:', e);
      console.error('Error details:', e.response?.data || e);
      
      // Log chi tiết hơn về lỗi
      if (e.errorFields) {
        console.log('Form validation errors:', e.errorFields);
        e.errorFields.forEach((field: any, index: number) => {
          console.log(`Field ${index + 1}:`, field.name, 'Errors:', field.errors);
        });
      }
      
      if (e.response) {
        console.log('Server response status:', e.response.status);
        console.log('Server response data:', e.response.data);
      }
      
      message.error(e?.response?.data?.error || e?.message || JSON.stringify(e));
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user =>
    (!filter.code || user.code?.toLowerCase().includes(filter.code.toLowerCase())) &&
    (!filter.name || user.name.toLowerCase().includes(filter.name.toLowerCase())) &&
    (!filter.email || user.email.toLowerCase().includes(filter.email.toLowerCase())) &&
    (!filter.role || user.role === filter.role) &&
    (!filter.createdAt || moment(user.createdAt).isSame(filter.createdAt, 'day'))
  ) : [];
  const columns = [
    { title: 'Mã nhân sự', dataIndex: 'code', key: 'code' },
    { title: 'Họ đệm', dataIndex: 'middleName', key: 'middleName' },
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Giới tính', dataIndex: 'gender', key: 'gender' },
    { title: 'Ngày sinh', dataIndex: 'dob', key: 'dob', render: (d: string) => d ? moment(d).format('DD/MM/YYYY') : '-' },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
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
        <Input placeholder="Mã nhân sự" style={{ width: 120 }} value={filter.code} onChange={e => setFilter(f => ({ ...f, code: e.target.value }))} />
        <Input placeholder="Tìm tên" style={{ width: 160 }} value={filter.name} onChange={e => setFilter(f => ({ ...f, name: e.target.value }))} />
        <Input placeholder="Tìm email" style={{ width: 180 }} value={filter.email} onChange={e => setFilter(f => ({ ...f, email: e.target.value }))} />
        <Select placeholder="Vai trò" style={{ width: 120 }} allowClear value={filter.role || undefined} onChange={v => setFilter(f => ({ ...f, role: v || '' }))}>
          <Option value="ADMIN">Admin</Option>
          <Option value="USER">User</Option>
          <Option value="PROJECT_MANAGER">Project Manager</Option>
          <Option value="BIM_MANAGER">BIM Manager</Option>
        </Select>
        <DatePicker placeholder="Ngày tạo" style={{ width: 140 }} value={filter.createdAt} onChange={d => setFilter(f => ({ ...f, createdAt: d }))} />
        <Button onClick={() => setFilter({ name: '', email: '', role: '', createdAt: null, code: '' })}>Xóa lọc</Button>
        <Button type="primary" onClick={handleAdd} icon={<span className="anticon">+</span>}>Thêm người dùng</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={filteredUsers} loading={loading} bordered />
      <Modal open={modalOpen} title={editingUser ? 'Sửa người dùng' : 'Thêm người dùng'} onOk={handleOk} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã nhân sự" rules={[{ required: true, message: 'Nhập mã nhân sự!' }]}> <Input /> </Form.Item>
          <Form.Item name="middleName" label="Họ đệm"> <Input /> </Form.Item>
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên!' }]}> <Input /> </Form.Item>
          <Form.Item name="gender" label="Giới tính"> <Select allowClear><Option value="Nam">Nam</Option><Option value="Nữ">Nữ</Option><Option value="Khác">Khác</Option></Select> </Form.Item>
          <Form.Item name="dob" label="Ngày sinh"> <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /> </Form.Item>
          <Form.Item name="address" label="Địa chỉ"> <Input /> </Form.Item>
          <Form.Item name="email" label="Tài khoản" rules={[{ required: true, message: 'Nhập tài khoản!' }]}> <Input /> </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: !editingUser, message: 'Nhập mật khẩu!' }]}> <Input.Password /> </Form.Item>
          <Form.Item name="role" label="Quyền" rules={[{ required: true, message: 'Chọn quyền!' }]}> <Select>
            <Option value="ADMIN">Quản trị viên</Option>
            <Option value="USER">Cấp nhân viên</Option>
            <Option value="PROJECT_MANAGER">Quản lý dự án</Option>
            <Option value="BIM_MANAGER">Quản lý BIM</Option>
          </Select> </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users; 