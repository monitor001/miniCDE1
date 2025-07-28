import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  Popconfirm, 
  message, 
  DatePicker,
  Card,
  Row,
  Col,
  Typography,
  Avatar,
  Tag,
  Tooltip,
  Divider,
  Tabs,
  Descriptions
} from 'antd';
import { 
  UserOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  CrownOutlined,
  SettingOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import { useOutletContext } from 'react-router-dom';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [form] = Form.useForm();
  const outletContext = useOutletContext<{ role?: string }>() || {};
  const role = outletContext.role || '';
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [activeTab, setActiveTab] = useState('members');
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Users data will be fetched from API

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
        setUsers([]); // Don't fallback to mock data
      }
    } catch (e) {
      console.error('Lỗi fetchUsers:', e);
      message.error('Không thể tải danh sách người dùng!');
      setUsers([]); // Don't fallback to mock data
    }
    setLoading(false);
  };

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const res = await axiosInstance.get('/projects');
      console.log('Projects data response:', res.data);
      if (res.data && Array.isArray(res.data)) {
        setProjects(res.data);
      } else if (res.data && res.data.projects && Array.isArray(res.data.projects)) {
        setProjects(res.data.projects);
      } else {
        console.error('Invalid projects data format:', res.data);
        setProjects([]);
      }
    } catch (e) {
      console.error('Lỗi fetchProjects:', e);
      setProjects([]);
    }
    setProjectsLoading(false);
  };

  useEffect(() => { 
    fetchUsers(); 
    fetchProjects();
  }, []);

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: { name: string; color: string } } = {
      'ADMIN': { name: 'Quản trị viên', color: 'red' },
      'PROJECT_MANAGER': { name: 'Quản lý dự án', color: 'blue' },
      'BIM_MANAGER': { name: 'Quản lý BIM', color: 'purple' },
      'CONTRIBUTOR': { name: 'Biên tập viên', color: 'green' },
      'VIEWER': { name: 'Người xem', color: 'grey' },
      'USER': { name: 'Người dùng', color: 'default' }
    };
    return roleMap[role] || { name: role, color: 'default' };
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? 
      <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'Hoạt động' : 'Không hoạt động';
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchText.toLowerCase());
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
      
      // Filter by project
      let matchesProject = true;
      if (selectedProject !== 'all') {
        if (user.projects && Array.isArray(user.projects)) {
          // Check if user has the selected project
          matchesProject = user.projects.some((project: any) => {
            if (typeof project === 'string') {
              // If project is string (project name), compare with project name
              const foundProject = projects.find(p => p.id === selectedProject);
              return foundProject && foundProject.name === project;
            } else {
              // If project is object, compare with project id
              return project.id === selectedProject || project === selectedProject;
            }
          });
        } else {
          matchesProject = false;
        }
      }
      
      return matchesSearch && matchesRole && matchesStatus && matchesProject;
    });
  };

  const handleView = (record: any) => {
    setViewingUser(record);
    setViewModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingUser(record);
    // Convert projects array to project IDs for form
    const formData = {
      ...record,
      projects: record.projects ? record.projects.map((project: any) => {
        // If project is string (project name), we need to find the project ID
        if (typeof project === 'string') {
          const foundProject = projects.find(p => p.name === project);
          return foundProject ? foundProject.id : project;
        }
        // If project is object with id, use the id
        return project.id || project;
      }) : []
    };
    form.setFieldsValue(formData);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      message.success('Đã xóa người dùng');
      fetchUsers();
    } catch (error) {
      message.error('Lỗi khi xóa người dùng');
    }
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
      
      const requestData: any = {
        name: values.name?.trim(),
        email: values.email?.trim().toLowerCase(),
        role: values.role,
        department: values.department,
        phone: values.phone
      };
      
      if (!editingUser || values.password) {
        requestData.password = values.password;
      }
      
      // Add projects data if provided
      if (values.projects && values.projects.length > 0) {
        requestData.projects = values.projects;
      }
      
      console.log('Sending user data to server:', requestData);
      
      if (editingUser) {
        const response = await axiosInstance.put(`/users/${editingUser.id}`, requestData);
        console.log('User update response:', response.data);
        message.success('Đã cập nhật người dùng');
      } else {
        const response = await axiosInstance.post('/users', requestData);
        console.log('User create response:', response.data);
        message.success('Đã thêm người dùng');
      }
      
      setModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Form submission error:', error);
      message.error(error.response?.data?.error || 'Lỗi khi lưu người dùng!');
    }
  };

  const handleExportExcel = () => {
    try {
      const filteredUsers = getFilteredUsers();
      
      // Prepare data for Excel
      const excelData = filteredUsers.map(user => ({
        'Họ và tên': user.name || '',
        'Email': user.email || '',
        'Số điện thoại': user.phone || '',
        'Vai trò': getRoleDisplayName(user.role).name,
        'Phòng ban': user.department || '',
        'Trạng thái': getStatusText(user.status),
        'Dự án tham gia': Array.isArray(user.projects) ? user.projects.join(', ') : '',
        'Đăng nhập cuối': user.lastLogin ? moment(user.lastLogin).format('DD/MM/YYYY HH:mm') : 'Chưa đăng nhập',
        'Ngày tạo': moment(user.createdAt).format('DD/MM/YYYY')
      }));

      // Create CSV content
      const headers = Object.keys(excelData[0] || {});
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => 
          headers.map(header => {
            const value = (row as any)[header] || '';
            // Escape commas and quotes in CSV
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `danh_sach_nguoi_dung_${moment().format('YYYY-MM-DD_HH-mm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success(`Đã xuất ${filteredUsers.length} người dùng ra file Excel`);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Lỗi khi xuất file Excel');
    }
  };

  const columns = [
    {
      title: 'THÀNH VIÊN',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ backgroundColor: '#1890ff' }}>
            {record.name ? record.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{text || 'Không có tên'}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{record.email || 'Không có email'}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.phone || 'Không có số điện thoại'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'VAI TRÒ',
      dataIndex: 'role',
      key: 'role',
      render: (role: string | undefined) => {
        const roleInfo = getRoleDisplayName(role || 'MEMBER');
        return <Tag color={roleInfo.color}>{roleInfo.name}</Tag>;
      },
    },
    {
      title: 'PHÒNG BAN',
      dataIndex: 'department',
      key: 'department',
      render: (department: string | undefined) => (
        <span>{department || 'Chưa phân công'}</span>
      ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status: string | undefined) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {getStatusIcon(status || 'active')}
          <span>{getStatusText(status || 'active')}</span>
        </div>
      ),
    },
    {
      title: 'DỰ ÁN',
      dataIndex: 'projects',
      key: 'projects',
      render: (projects: string[] | undefined) => (
        <div>
          {projects && projects.length > 0 ? (
            projects.map((project, index) => (
              <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                {project}
              </Tag>
            ))
          ) : (
            <Text type="secondary">Chưa có dự án</Text>
          )}
        </div>
      ),
    },
    {
      title: 'ĐĂNG NHẬP CUỐI',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date: string | undefined) => (
        <div style={{ fontSize: 12 }}>
          {date ? moment(date).format('YYYY-MM-DD HH:mm') : 'Chưa đăng nhập'}
        </div>
      ),
    },
    {
      title: 'THAO TÁC',
      key: 'actions',
      render: (record: any) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Tooltip title="Xóa">
              <Button type="text" size="small" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderMembersTab = () => (
    <div>
      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input
              placeholder="Tìm kiếm thành viên..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={8}>
            <Space>
              <Select
                value={selectedRole}
                onChange={setSelectedRole}
                style={{ width: 150 }}
                placeholder="Tất cả vai trò"
              >
                <Option value="all">Tất cả vai trò</Option>
                <Option value="ADMIN">Quản trị viên</Option>
                <Option value="PROJECT_MANAGER">Quản lý dự án</Option>
                <Option value="BIM_MANAGER">Quản lý BIM</Option>
                <Option value="CONTRIBUTOR">Biên tập viên</Option>
                <Option value="VIEWER">Người xem</Option>
                <Option value="USER">Người dùng</Option>
              </Select>
              
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 150 }}
                placeholder="Tất cả trạng thái"
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Không hoạt động</Option>
              </Select>
              
              <Select
                value={selectedProject}
                onChange={setSelectedProject}
                style={{ width: 150 }}
                placeholder="Tất cả dự án"
                loading={projectsLoading}
              >
                <Option value="all">Tất cả dự án</Option>
                {projects.map(project => (
                  <Option key={project.id} value={project.id}>
                    {project.name}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
                Xuất Excel
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                Thêm Thành Viên
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Table
        columns={columns}
        dataSource={getFilteredUsers()}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} thành viên`,
        }}
      />
    </div>
  );

  const renderRolesTab = () => (
    <div>
      <Text>Quản lý vai trò và quyền hạn</Text>
    </div>
  );

  const renderGroupsTab = () => (
    <div>
      <Text>Quản lý nhóm và tổ chức</Text>
    </div>
  );

  const renderPermissionsTab = () => (
    <div>
      <Text>Ma trận phân quyền</Text>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <TeamOutlined style={{ marginRight: 8 }} />
          Thành Viên / Phân Quyền
        </Title>
        <Text type="secondary">
          Quản lý thành viên, vai trò và phân quyền truy cập hệ thống
        </Text>
      </div>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <TeamOutlined />
              Thành Viên ({users.length})
            </span>
          } 
          key="members"
        >
          {renderMembersTab()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <CrownOutlined />
              Vai Trò (5)
            </span>
          } 
          key="roles"
        >
          {renderRolesTab()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <TeamOutlined />
              Nhóm (3)
            </span>
          } 
          key="groups"
        >
          {renderGroupsTab()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <SettingOutlined />
              Phân Quyền
            </span>
          } 
          key="permissions"
        >
          {renderPermissionsTab()}
        </TabPane>
      </Tabs>

      {/* Add/Edit User Modal */}
      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="Phòng ban"
                rules={[{ required: true, message: 'Vui lòng chọn phòng ban!' }]}
              >
                <Select placeholder="Chọn phòng ban">
                  <Option value="Kỹ thuật">Kỹ thuật</Option>
                  <Option value="Quản lý dự án">Quản lý dự án</Option>
                  <Option value="Thiết kế">Thiết kế</Option>
                  <Option value="Giám sát">Giám sát</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Vai trò"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
              >
                <Select placeholder="Chọn vai trò">
                  <Option value="ADMIN">Quản trị viên</Option>
                  <Option value="PROJECT_MANAGER">Quản lý dự án</Option>
                  <Option value="BIM_MANAGER">Quản lý BIM</Option>
                  <Option value="CONTRIBUTOR">Biên tập viên</Option>
                  <Option value="VIEWER">Người xem</Option>
                  <Option value="USER">Người dùng</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label={editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
                rules={editingUser ? [] : [{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              >
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="projects"
            label="Dự án tham gia"
          >
            <Select
              mode="multiple"
              placeholder="Chọn dự án"
              loading={projectsLoading}
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* View User Modal */}
      <Modal
        title="Chi tiết người dùng"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            Đóng
          </Button>
        ]}
        width={600}
      >
        {viewingUser && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={80} style={{ backgroundColor: '#1890ff' }}>
                {viewingUser.name ? viewingUser.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
              </Avatar>
              <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
                {viewingUser.name}
              </Title>
              <Text type="secondary">{viewingUser.email}</Text>
            </div>
            
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Số điện thoại">
                {viewingUser.phone || 'Chưa có'}
              </Descriptions.Item>
              <Descriptions.Item label="Phòng ban">
                {viewingUser.department || 'Chưa phân công'}
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                <Tag color={getRoleDisplayName(viewingUser.role).color}>
                  {getRoleDisplayName(viewingUser.role).name}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {getStatusIcon(viewingUser.status)}
                  <span>{getStatusText(viewingUser.status)}</span>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Đăng nhập cuối">
                {viewingUser.lastLogin ? moment(viewingUser.lastLogin).format('YYYY-MM-DD HH:mm') : 'Chưa đăng nhập'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {moment(viewingUser.createdAt).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="Dự án tham gia" span={2}>
                {viewingUser.projects && viewingUser.projects.length > 0 ? (
                  <div>
                    {viewingUser.projects.map((project: string, index: number) => (
                      <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                        {project}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary">Chưa có dự án</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Users; 