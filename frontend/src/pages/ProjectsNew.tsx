import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Table, 
  Tag, 
  Space, 
  Row, 
  Col, 
  Statistic, 
  Select, 
  Modal, 
  Form, 
  message,
  Tooltip,
  Avatar,
  Typography,
  Progress,
  Badge,
  Divider,
  Drawer,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined,
  FolderOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SettingOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  MessageOutlined,
  SendOutlined,
  CommentOutlined
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import moment from 'moment';
import { useSelector } from 'react-redux';

const { Title, Text } = Typography;
const { Option } = Select;

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  progress: number;
  manager: string;
  managerId?: string;
  teamSize: number;
  documents: number;
  tasks: number;
  issues: number;
  members: ProjectMember[];
  permissions: ProjectPermission[];
  comments?: ProjectComment[];
}

interface ProjectMember {
  id?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  role: 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER' | 'PROJECT_MANAGER' | 'BIM_MANAGER' | 'CONTRIBUTOR';
  joinedAt?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  // Backend trả về user object
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface ProjectPermission {
  id: string;
  userId: string;
  permission: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN';
  resource: 'PROJECT' | 'DOCUMENTS' | 'TASKS' | 'ISSUES' | 'CALENDAR';
  grantedAt: string;
}

interface ProjectComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
  user?: { // Added user property for consistency with member
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const ProjectsNew: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [memberForm] = Form.useForm();
  const [permissionForm] = Form.useForm();
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [commentForm] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelType, setRightPanelType] = useState<'members' | 'permissions' | 'comments' | null>(null);
  const theme = useSelector((state: any) => state.ui.theme);
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const currentUser = useSelector((state: any) => state.auth.user);
  const isAdmin = currentUser?.role === 'ADMIN';

  // Projects data will be fetched from API

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/projects');
      console.log('Projects API response:', response.data);
      
      // Kiểm tra dữ liệu trả về
      let projectsData = [];
      if (response.data && Array.isArray(response.data)) {
        projectsData = response.data;
      } else if (response.data && response.data.projects && Array.isArray(response.data.projects)) {
        projectsData = response.data.projects;
      } else {
        console.warn('Unexpected projects data format:', response.data);
        projectsData = [];
      }
      
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      message.error('Không thể tải danh sách dự án!');
      setProjects([]); // Don't fallback to mock data
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/users');
      console.log('Users API response:', response.data);
      
      // Kiểm tra dữ liệu trả về
      let usersData = [];
      if (response.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && response.data.users && Array.isArray(response.data.users)) {
        usersData = response.data.users;
      } else {
        console.warn('Unexpected users data format:', response.data);
        usersData = [];
      }
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Không thể tải danh sách người dùng!');
      setUsers([]); // Ensure users is always an array
    }
  };

  const fetchComments = async (projectId: string) => {
    try {
      const response = await axiosInstance.get(`/projects/${projectId}/comments`);
      console.log('Comments API response:', response.data);
      
      // Kiểm tra dữ liệu trả về
      let commentsData = [];
      if (response.data && Array.isArray(response.data)) {
        commentsData = response.data;
      } else if (response.data && response.data.comments && Array.isArray(response.data.comments)) {
        commentsData = response.data.comments;
      } else {
        console.warn('Unexpected comments data format:', response.data);
        commentsData = [];
      }
      
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    }
  };

  const getStatusCount = (status: string) => {
    if (!Array.isArray(projects)) {
      console.warn('Projects is not an array in getStatusCount:', projects);
      return 0;
    }
    
    if (status === 'all') return projects.length;
    return projects.filter(project => project.status === status).length;
  };

  const getFilteredProjects = () => {
    if (!Array.isArray(projects)) {
      console.warn('Projects is not an array:', projects);
      return [];
    }
    
    let filtered = projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || project.priority === selectedPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sắp xếp theo trạng thái và mức độ ưu tiên
    const statusOrder = {
      'ACTIVE': 1,      // Đang thực hiện
      'PLANNING': 2,    // Đang lên kế hoạch
      'ON_HOLD': 3,     // Đang tạm dừng
      'COMPLETED': 4,   // Hoàn thành
      'ARCHIVED': 5     // Lưu trữ
    };

    const priorityOrder = {
      'HIGH': 1,        // Cao
      'MEDIUM': 2,      // Trung bình
      'LOW': 3          // Thấp
    };

    filtered.sort((a, b) => {
      // Sắp xếp theo trạng thái trước
      const statusA = statusOrder[a.status as keyof typeof statusOrder] || 999;
      const statusB = statusOrder[b.status as keyof typeof statusOrder] || 999;
      
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      
      // Nếu cùng trạng thái, sắp xếp theo mức độ ưu tiên (chỉ áp dụng cho ACTIVE)
      if (a.status === 'ACTIVE' && b.status === 'ACTIVE') {
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 999;
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 999;
        return priorityA - priorityB;
      }
      
      // Các trạng thái khác sắp xếp theo tên dự án
      return a.name.localeCompare(b.name);
    });

    return filtered;
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string; icon: React.ReactNode } } = {
      'ACTIVE': { label: 'Đang thực hiện', color: 'green', icon: <CheckCircleOutlined /> },
      'PLANNING': { label: 'Lập kế hoạch', color: 'blue', icon: <ClockCircleOutlined /> },
      'ON_HOLD': { label: 'Tạm dừng', color: 'orange', icon: <ExclamationCircleOutlined /> },
      'COMPLETED': { label: 'Hoàn thành', color: 'purple', icon: <CheckCircleOutlined /> },
      'ARCHIVED': { label: 'Lưu trữ', color: 'grey', icon: <CloseCircleOutlined /> }
    };
    return statusMap[status] || { label: status, color: 'default', icon: null };
  };

  const getPriorityDisplay = (priority: string) => {
    const priorityMap: { [key: string]: { label: string; color: string } } = {
      'HIGH': { label: 'Cao', color: 'red' },
      'MEDIUM': { label: 'Trung bình', color: 'orange' },
      'LOW': { label: 'Thấp', color: 'green' },
      'NONE': { label: 'Không', color: 'default' }
    };
    return priorityMap[priority] || { label: priority, color: 'default' };
  };



  const handleAdd = () => {
    setEditingProject(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: Project) => {
    setEditingProject(record);
    // Tìm người quản lý dự án từ danh sách members
    const manager = (record.members || []).find(member => 
      member.role === 'PROJECT_MANAGER' || member.role === 'MANAGER'
    );
    // Chuyển đổi ngày về format YYYY-MM-DD
    const startDate = record.startDate ? moment(record.startDate).format('YYYY-MM-DD') : undefined;
    const endDate = record.endDate ? moment(record.endDate).format('YYYY-MM-DD') : undefined;
    form.setFieldsValue({ 
      ...record, 
      startDate,
      endDate,
      managerId: manager?.userId || manager?.user?.id || undefined 
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/projects/${id}`);
      message.success('Đã xóa dự án!');
      
      // Cập nhật dữ liệu trong state ngay lập tức
      setProjects(prevProjects => prevProjects.filter(project => project.id !== id));
      
      // Đóng panel nếu đang mở dự án bị xóa
      if (selectedProject && selectedProject.id === id) {
        setRightPanelOpen(false);
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      message.error('Lỗi khi xóa dự án!');
    }
  };

  const handleManageMembers = (project: Project) => {
    setSelectedProject(project);
    setRightPanelType('members');
    setRightPanelOpen(true);
  };

  const handleViewDetails = (project: Project) => {
    // Navigate to project detail page
    window.location.href = `/projects/${project.id}`;
  };

  const handleManagePermissions = (project: Project) => {
    setSelectedProject(project);
    setRightPanelType('permissions');
    setRightPanelOpen(true);
  };

  const handleComments = (project: Project) => {
    setSelectedProject(project);
    setRightPanelType('comments');
    setRightPanelOpen(true);
    fetchComments(project.id);
  };

  const handleAddComment = async (values: any) => {
    if (!selectedProject) return;
    
    try {
      const response = await axiosInstance.post(`/projects/${selectedProject.id}/comments`, {
        content: values.content
      });
      
      message.success('Đã thêm bình luận thành công!');
      commentForm.resetFields();
      
      // Cập nhật comments ngay lập tức
      if (response.data) {
        setComments(prevComments => [response.data, ...prevComments]);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error('Không thể thêm bình luận!');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedProject) return;
    try {
      await axiosInstance.delete(`/projects/${selectedProject.id}/comments/${commentId}`);
      message.success('Đã xoá bình luận!');
      fetchComments(selectedProject.id);
    } catch (err) {
      message.error('Xoá bình luận thất bại');
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await axiosInstance.get('/api/users');
      console.log('Available users API response:', response.data);
      
      // Kiểm tra dữ liệu trả về
      let usersData = [];
      if (response.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && response.data.users && Array.isArray(response.data.users)) {
        usersData = response.data.users;
      } else {
        console.warn('Unexpected available users data format:', response.data);
        usersData = [];
      }
      
      setAvailableUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAvailableUsers([]); // Ensure availableUsers is always an array
    }
  };

  const handleAddMember = async (values: any) => {
    if (!selectedProject) return;
    
    try {
      const response = await axiosInstance.post(`/api/projects/${selectedProject.id}/members`, values);
      message.success('Đã thêm thành viên!');
      
      // Cập nhật dữ liệu trong state ngay lập tức
      if (response.data) {
        setProjects(prevProjects => 
          prevProjects.map(project => 
            project.id === selectedProject.id 
              ? { ...project, members: [...(project.members || []), response.data] }
              : project
          )
        );
        
        // Cập nhật selectedProject
        setSelectedProject(prev => 
          prev ? { ...prev, members: [...(prev.members || []), response.data] } : null
        );
      }
    } catch (error) {
      console.error('Error adding member:', error);
      message.error('Lỗi khi thêm thành viên!');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedProject) return;
    
    try {
      await axiosInstance.delete(`/api/projects/${selectedProject.id}/members/${memberId}`);
      message.success('Đã xóa thành viên!');
      
      // Cập nhật dữ liệu trong state ngay lập tức
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === selectedProject.id 
            ? { ...project, members: (project.members || []).filter(m => m.id !== memberId) }
            : project
        )
      );
      
      // Cập nhật selectedProject
      setSelectedProject(prev => 
        prev ? { ...prev, members: (prev.members || []).filter(m => m.id !== memberId) } : null
      );
    } catch (error) {
      console.error('Error removing member:', error);
      message.error('Lỗi khi xóa thành viên!');
    }
  };

  const handleUpdatePermission = async (values: any) => {
    if (!selectedProject) return;
    
    try {
      await axiosInstance.put(`/api/projects/${selectedProject.id}/permissions`, values);
      message.success('Đã cập nhật phân quyền!');
      setRightPanelOpen(false);
      fetchProjects();
    } catch (error) {
      message.error('Lỗi khi cập nhật phân quyền!');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Chuẩn bị dữ liệu gửi lên backend
      const projectData = {
        name: values.name,
        description: values.description,
        status: values.status,
        startDate: values.startDate,
        endDate: values.endDate,
        priority: values.priority,
        // Nếu có managerId, thêm vào memberIds để backend xử lý
        memberIds: values.managerId ? [values.managerId] : []
      };
      
      if (editingProject) {
        await axiosInstance.put(`/projects/${editingProject.id}`, projectData);
        message.success('Đã cập nhật dự án!');
        
        // Cập nhật dữ liệu trong state ngay lập tức
        setProjects(prevProjects => 
          prevProjects.map(project => 
            project.id === editingProject.id 
              ? { ...project, ...projectData }
              : project
          )
        );
        
        // Cập nhật selectedProject nếu đang mở panel
        if (selectedProject && selectedProject.id === editingProject.id) {
          setSelectedProject(prev => prev ? { ...prev, ...projectData } : null);
        }
      } else {
        const response = await axiosInstance.post('/projects', projectData);
        message.success('Đã thêm dự án!');
        
        // Thêm dự án mới vào state
        if (response.data) {
          setProjects(prevProjects => [response.data, ...prevProjects]);
        }
      }
      
      setModalOpen(false);
      form.resetFields();
      setEditingProject(null);
    } catch (error: any) {
      console.error('Error saving project:', error);
      message.error(error.response?.data?.error || 'Lỗi khi lưu dự án!');
    }
  };

  const columns = [
    {
      title: 'DỰ ÁN',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ backgroundColor: '#1890ff' }}>
            <FolderOutlined />
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{record.description}</div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {moment(record.startDate).format('DD/MM/YYYY')} - {moment(record.endDate).format('DD/MM/YYYY')}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusInfo = getStatusDisplay(status);
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.label}
          </Tag>
        );
      },
    },
    {
      title: 'MỨC ĐỘ ƯU TIÊN',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const priorityInfo = getPriorityDisplay(priority);
        return (
          <Tag color={priorityInfo.color}>
            {priorityInfo.label}
          </Tag>
        );
      },
    },
    {
      title: 'NGƯỜI PHỤ TRÁCH',
      key: 'manager',
      render: (record: Project) => {
        // Tìm người quản lý dự án từ danh sách members
        const manager = (record.members || []).find(member => 
          member.role === 'PROJECT_MANAGER' || member.role === 'MANAGER'
        );
        
        // Backend trả về user.name, không phải userName
        const managerName = manager?.user?.name || 'Chưa phân công';
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={24} style={{ backgroundColor: '#1890ff' }}>
              {(managerName || 'U').charAt(0)}
            </Avatar>
            <span style={{ fontSize: 14 }}>{managerName}</span>
          </div>
        );
      },
    },
    {
      title: 'THAO TÁC',
      key: 'actions',
      render: (record: Project) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
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
          <Tooltip title="Quản lý thành viên">
            <Button 
              type="text" 
              size="small" 
              icon={<TeamOutlined />}
              onClick={() => handleManageMembers(record)}
            />
          </Tooltip>
          <Tooltip title="Phân quyền">
            <Button 
              type="text" 
              size="small" 
              icon={<SettingOutlined />}
              onClick={() => handleManagePermissions(record)}
            />
          </Tooltip>
          <Tooltip title="Bình luận">
            <Button 
              type="text" 
              size="small" 
              icon={<MessageOutlined />}
              onClick={() => handleComments(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button 
              type="text" 
              size="small" 
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Quản Lý Dự Án</Title>
          <Text type="secondary">Quản lý và theo dõi các dự án xây dựng</Text>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />}>
            Xuất Báo Cáo
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm Dự Án
          </Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng Dự Án"
              value={projects.length}
              prefix={<FolderOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang Thực Hiện"
              value={getStatusCount('ACTIVE')}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Lập Kế Hoạch"
              value={getStatusCount('PLANNING')}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Hoàn Thành"
              value={getStatusCount('COMPLETED')}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter and Search */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input
              placeholder="Tìm kiếm dự án..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={8}>
            <Space>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 150 }}
                placeholder="Tất cả trạng thái"
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="ACTIVE">Đang thực hiện</Option>
                <Option value="PLANNING">Lập kế hoạch</Option>
                <Option value="ON_HOLD">Tạm dừng</Option>
                <Option value="COMPLETED">Hoàn thành</Option>
                <Option value="ARCHIVED">Lưu trữ</Option>
              </Select>
              
              <Select
                value={selectedPriority}
                onChange={setSelectedPriority}
                style={{ width: 150 }}
                placeholder="Tất cả ưu tiên"
              >
                <Option value="all">Tất cả ưu tiên</Option>
                <Option value="HIGH">Cao</Option>
                <Option value="MEDIUM">Trung bình</Option>
                <Option value="LOW">Thấp</Option>
              </Select>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Button icon={<ClearOutlined />} onClick={() => {
              setSearchText('');
              setSelectedStatus('all');
              setSelectedPriority('all');
            }}>
              Xóa bộ lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Projects Table */}
      <Card title={`Danh sách dự án (${getFilteredProjects().length})`}>
        <Table
          columns={columns}
          dataSource={getFilteredProjects() || []}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} dự án`,
          }}
        />
      </Card>

      {/* Add/Edit Project Modal */}
      <Modal
        title={editingProject ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}
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
                label="Tên dự án"
                rules={[{ required: true, message: 'Vui lòng nhập tên dự án!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Option value="ACTIVE">Đang thực hiện</Option>
                  <Option value="PLANNING">Lập kế hoạch</Option>
                  <Option value="ON_HOLD">Tạm dừng</Option>
                  <Option value="COMPLETED">Hoàn thành</Option>
                  <Option value="ARCHIVED">Lưu trữ</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Ngày bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu!' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="Ngày kết thúc"
                rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc!' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Mức độ ưu tiên"
                rules={[{ required: true, message: 'Vui lòng chọn mức độ ưu tiên!' }]}
              >
                <Select placeholder="Chọn mức độ ưu tiên">
                  <Option value="HIGH">Cao</Option>
                  <Option value="MEDIUM">Trung bình</Option>
                  <Option value="LOW">Thấp</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="managerId"
                label="Người phụ trách"
                rules={[{ required: true, message: 'Vui lòng chọn người phụ trách!' }]}
              >
                <Select
                  placeholder="Chọn người phụ trách"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {(users || []).map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Right Panel Drawer */}
      <Drawer
        title={
          rightPanelType === 'members' ? `Thành viên - ${selectedProject?.name}` :
          rightPanelType === 'permissions' ? `Phân quyền - ${selectedProject?.name}` :
          rightPanelType === 'comments' ? `Bình luận - ${selectedProject?.name}` :
          'Chi tiết dự án'
        }
        placement="right"
        width={320}
        onClose={() => setRightPanelOpen(false)}
        open={rightPanelOpen}
        bodyStyle={{ paddingBottom: 80 }}
        mask={false}
        maskClosable={false}
        closable={true}
        style={{ zIndex: 1000 }}
      >
        {rightPanelType === 'members' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  memberForm.resetFields();
                  fetchAvailableUsers();
                }}
              >
                Thêm thành viên
              </Button>
            </div>

            <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {(selectedProject?.members || []).map((member) => (
                <Card 
                  key={member.id} 
                  size="small" 
                  style={{ marginBottom: 8 }}
                  bodyStyle={{ padding: 12 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Avatar size={32}>
                      {(member.user?.name || member.userName || 'U').charAt(0)}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{member.user?.name || member.userName || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{member.user?.email || member.userEmail || 'No email'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color={
                      member.role === 'OWNER' ? 'red' : 
                      member.role === 'MANAGER' ? 'orange' : 
                      member.role === 'MEMBER' ? 'blue' : 'green'
                    }>
                      {member.role}
                    </Tag>
                    <Button 
                      size="small" 
                      danger
                      onClick={() => handleRemoveMember(member.id || '')}
                    >
                      Xóa
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {rightPanelType === 'permissions' && (
          <div style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
            {(selectedProject?.permissions || []).map((permission) => {
              const member = (selectedProject?.members || []).find(m => m.userId === permission.userId);
              return (
                <Card 
                  key={permission.id} 
                  size="small" 
                  style={{ marginBottom: 8 }}
                  bodyStyle={{ padding: 12 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Avatar size={24}>
                      {(member?.user?.name || member?.userName || 'U').charAt(0)}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{member?.user?.name || member?.userName || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{member?.user?.email || member?.userEmail || 'No email'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                    <Tag color={
                      permission.permission === 'ADMIN' ? 'red' : 
                      permission.permission === 'WRITE' ? 'orange' : 
                      permission.permission === 'READ' ? 'blue' : 'purple'
                    }>
                      {permission.permission}
                    </Tag>
                    <Tag color="blue">
                      {permission.resource === 'PROJECT' ? 'Dự án' :
                       permission.resource === 'DOCUMENTS' ? 'Tài liệu' :
                       permission.resource === 'TASKS' ? 'Nhiệm vụ' :
                       permission.resource === 'ISSUES' ? 'Vấn đề' : 'Lịch'}
                    </Tag>
                    <Button 
                      size="small"
                      onClick={() => {
                        permissionForm.setFieldsValue(permission);
                      }}
                    >
                      Sửa
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {rightPanelType === 'comments' && (
          <>
            <div style={{ 
              maxHeight: 'calc(100vh - 250px)', 
              overflowY: 'auto', 
              marginBottom: 16,
              padding: '0 8px',
              background: isDarkMode ? '#18191a' : '#fff',
              border: isDarkMode ? '1.5px solid #333' : '1.5px solid #e6f7ff',
              borderRadius: 8
            }}>
              {comments.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 40, 
                  color: isDarkMode ? '#bbb' : '#8c8c8c',
                  background: isDarkMode ? '#232324' : 'rgba(255,255,255,0.7)',
                  borderRadius: 8,
                  border: isDarkMode ? '1px dashed #444' : '1px dashed #b7e0fa'
                }}>
                  <CommentOutlined style={{ fontSize: 24, marginBottom: 8, color: isDarkMode ? '#70c1ff' : '#91caff' }} />
                  <div>Chưa có bình luận nào</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Hãy là người đầu tiên bình luận!</div>
                </div>
              ) : (
                <div>
                  {(comments || []).map((comment, index) => (
                    <Card 
                      key={comment.id} 
                      size="small" 
                      style={{ 
                        marginBottom: 12,
                        borderRadius: 8,
                        boxShadow: isDarkMode ? '0 1px 3px rgba(0,0,0,0.16)' : '0 1px 3px rgba(0,0,0,0.06)',
                        border: isDarkMode ? '1px solid #333' : '1px solid #e6f7ff',
                        background: isDarkMode ? '#232324' : 'rgba(255,255,255,0.95)'
                      }}
                      bodyStyle={{ padding: 16 }}
                      extra={isAdmin && (
                        <Popconfirm
                          title="Xoá bình luận này?"
                          onConfirm={() => handleDeleteComment(comment.id)}
                          okText="Xoá"
                          cancelText="Huỷ"
                        >
                          <Button type="link" danger size="small">Xoá</Button>
                        </Popconfirm>
                      )}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                        <Avatar 
                          size={32}
                          style={{ 
                            background: isDarkMode ? 'linear-gradient(135deg, #1890ff 0%, #70c1ff 100%)' : 'linear-gradient(135deg, #1890ff 0%, #70c1ff 100%)',
                            color: '#fff', fontWeight: 'bold',
                            boxShadow: '0 2px 8px #bae7ff'
                          }}
                        >
                          {(comment.user?.name || comment.authorName || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: 600, 
                            fontSize: 14, 
                            color: isDarkMode ? '#fff' : '#262626',
                            marginBottom: 4
                          }}>
                            {comment.user?.name || comment.authorName || 'Unknown'}
                          </div>
                          <div style={{ 
                            fontSize: 12, 
                            color: isDarkMode ? '#bbb' : '#8c8c8c',
                            marginBottom: 8
                          }}>
                            <CalendarOutlined style={{ marginRight: 4 }} />
                            {moment(comment.createdAt).format('DD/MM/YYYY HH:mm')}
                          </div>
                          <div style={{ 
                            fontSize: 13, 
                            lineHeight: 1.6,
                            color: isDarkMode ? '#fff' : '#595959',
                            background: isDarkMode ? '#232324' : '#f4faff',
                            padding: 12,
                            borderRadius: 6,
                            border: isDarkMode ? '1px solid #333' : '1px solid #e6f7ff'
                          }}>
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              padding: '16px 24px', 
              background: isDarkMode ? '#18191a' : '#fff',
              borderTop: isDarkMode ? '1.5px solid #333' : '1.5px solid #b7e0fa',
              boxShadow: isDarkMode ? '0 -2px 8px rgba(24,144,255,0.16)' : '0 -2px 8px rgba(24,144,255,0.06)'
            }}>
              <Form form={commentForm} onFinish={handleAddComment}>
                <Form.Item
                  name="content"
                  rules={[{ required: true, message: 'Vui lòng nhập nội dung bình luận!' }]}
                >
                  <Input.TextArea 
                    placeholder="Nhập bình luận của bạn..." 
                    rows={3}
                    showCount
                    style={{
                      borderRadius: 8,
                      border: isDarkMode ? '1.5px solid #333' : '1.5px solid #b7e0fa',
                      resize: 'none',
                      background: isDarkMode ? '#232324' : '#f4faff',
                      color: isDarkMode ? '#fff' : '#222'
                    }}
                  />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    size="middle" 
                    block
                    style={{
                      borderRadius: 8,
                      height: 40,
                      background: isDarkMode ? 'linear-gradient(90deg, #1890ff 0%, #70c1ff 100%)' : 'linear-gradient(90deg, #1890ff 0%, #70c1ff 100%)',
                      border: 'none',
                      fontWeight: 600,
                      boxShadow: isDarkMode ? '0 2px 8px #222' : '0 2px 8px #bae7ff',
                      color: '#fff',
                      letterSpacing: 1
                    }}
                    icon={<SendOutlined />}
                  >
                    Gửi bình luận
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </>
        )}
      </Drawer>


    </div>
  );
};

export default ProjectsNew; 