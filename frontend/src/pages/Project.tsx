import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  Select, 
  message, 
  Card, 
  List, 
  Upload, 
  Space, 
  Popconfirm, 
  Drawer, 
  Typography, 
  Row, 
  Col, 
  Tag, 
  Radio, 
  Tabs, 
  Badge, 
  Avatar, 
  Tooltip, 
  Mentions,
  Statistic,
  Divider
} from 'antd';
import ProjectCard from '../components/ProjectCard';
import axiosInstance from '../axiosConfig';
import moment from 'moment';
import { 
  PlusOutlined, 
  UploadOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  FileOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined, 
  CloseCircleOutlined, 
  MessageOutlined, 
  UserOutlined,
  FolderOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
// @ts-ignore
import { debounce } from 'lodash';

const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

// Định nghĩa các mức độ ưu tiên
const priorityLevels = [
  { value: 'HIGH', label: 'Cao', color: 'red' },
  { value: 'MEDIUM', label: 'Trung bình', color: 'orange' },
  { value: 'LOW', label: 'Thấp', color: 'green' },
  { value: 'NONE', label: 'Không', color: 'default' }
];

const Project: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [form] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [noteForm] = Form.useForm();
  const [imgLoading, setImgLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const isDarkMode = useSelector((state: any) => state.ui.theme === 'dark' || (state.ui.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [commentProject, setCommentProject] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentValue, setCommentValue] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  
  // Tách biệt comments cho từng dự án
  const [projectComments, setProjectComments] = useState<{ [key: string]: any[] }>({});
  const [projectCommentsLoading, setProjectCommentsLoading] = useState<{ [key: string]: boolean }>({});

  // Mock data for demonstration
  const mockProjects = [
    {
      id: '1',
      name: 'Dự án Cầu Vượt',
      description: 'Xây dựng cầu vượt tại ngã tư sầm uất',
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      progress: 65,
      manager: 'Trần Thị B',
      teamSize: 12,
      documents: 45,
      tasks: 28,
      issues: 5,
      members: [
        { id: '1', userId: '1', userName: 'Trần Thị B', userEmail: 'tranthib@company.com', role: 'OWNER', joinedAt: '2024-01-15', status: 'ACTIVE' },
        { id: '2', userId: '2', userName: 'Nguyễn Văn A', userEmail: 'nguyenvana@company.com', role: 'MANAGER', joinedAt: '2024-01-16', status: 'ACTIVE' }
      ]
    },
    {
      id: '2',
      name: 'Dự án Hạ Tầng ABC',
      description: 'Nâng cấp hạ tầng giao thông khu vực ABC',
      status: 'PLANNING',
      priority: 'MEDIUM',
      startDate: '2024-03-01',
      endDate: '2025-06-30',
      progress: 25,
      manager: 'Lê Văn C',
      teamSize: 8,
      documents: 23,
      tasks: 15,
      issues: 2,
      members: [
        { id: '3', userId: '3', userName: 'Lê Văn C', userEmail: 'levanc@company.com', role: 'OWNER', joinedAt: '2024-03-01', status: 'ACTIVE' }
      ]
    },
    {
      id: '3',
      name: 'Dự án Tòa Nhà Văn Phòng',
      description: 'Thiết kế và xây dựng tòa nhà văn phòng cao tầng',
      status: 'ON_HOLD',
      priority: 'LOW',
      startDate: '2024-02-01',
      endDate: '2025-03-31',
      progress: 40,
      manager: 'Nguyễn Văn A',
      teamSize: 15,
      documents: 67,
      tasks: 42,
      issues: 8,
      members: [
        { id: '4', userId: '1', userName: 'Nguyễn Văn A', userEmail: 'nguyenvana@company.com', role: 'OWNER', joinedAt: '2024-02-01', status: 'ACTIVE' }
      ]
    },
    {
      id: '4',
      name: 'Dự án Cải Tạo Đường',
      description: 'Cải tạo và mở rộng đường giao thông chính',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      startDate: '2023-06-01',
      endDate: '2024-01-31',
      progress: 100,
      manager: 'Phạm Thị D',
      teamSize: 10,
      documents: 34,
      tasks: 20,
      issues: 3,
      members: [
        { id: '5', userId: '4', userName: 'Phạm Thị D', userEmail: 'phamthid@company.com', role: 'OWNER', joinedAt: '2023-06-01', status: 'ACTIVE' }
      ]
    },
    {
      id: '5',
      name: 'Dự án Công Viên',
      description: 'Thiết kế và xây dựng công viên giải trí',
      status: 'ACTIVE',
      priority: 'LOW',
      startDate: '2024-04-01',
      endDate: '2024-10-31',
      progress: 30,
      manager: 'Hoàng Văn E',
      teamSize: 6,
      documents: 18,
      tasks: 12,
      issues: 1,
      members: [
        { id: '6', userId: '5', userName: 'Hoàng Văn E', userEmail: 'hoangvane@company.com', role: 'OWNER', joinedAt: '2024-04-01', status: 'ACTIVE' }
      ]
    }
  ];
  
  // Kiểm tra authentication khi component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('Project component mount - Auth check:', {
      hasToken: !!token,
      hasUser: !!user,
      tokenLength: token ? token.length : 0,
      userData: user ? JSON.parse(user) : null
    });
    
    if (!token || !user) {
      console.error('Authentication missing in Project component');
      return;
    }
    
    // Fetch data
    fetchProjects();
    fetchUsers();
    
    // Socket.IO setup for project comments
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'https://qlda.hoanglong24.com';
    console.log('Connecting to Socket.IO at:', socketUrl);
    
    try {
      const socket = io(socketUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      const showCommentToast = debounce((msg: string) => message.info(msg), 1000, { leading: true, trailing: false });
      
      socket.on('connect', () => {
        console.log('Socket.IO connected successfully:', socket.id);
      });
      
      socket.on('connect_error', (error: Error) => {
        console.error('Socket.IO connection error:', error);
      });
      
      socket.on('project:note:created', (data: any) => {
        showCommentToast('Có bình luận mới cho dự án!');
        // Refresh comments for the specific project
        if (commentProject && data.projectId === commentProject.id) {
          fetchComments(commentProject.id);
        }
        // Also refresh for project detail if it's the same project
        if (detail && data.projectId === detail.id) {
          fetchProjectDetailComments(detail.id);
        }
      });
      
      socket.on('project:note:deleted', (data: any) => {
        showCommentToast('Bình luận đã được xóa');
        // Refresh comments for the specific project
        if (commentProject && data.projectId === commentProject.id) {
          fetchComments(commentProject.id);
        }
        // Also refresh for project detail if it's the same project
        if (detail && data.projectId === detail.id) {
          fetchProjectDetailComments(detail.id);
        }
      });
      
      return () => {
        socket.disconnect();
      };
    } catch (error) {
      console.error('Socket.IO setup error:', error);
    }
  }, []);
  
  // Hàm định nghĩa giá trị sắp xếp cho các trạng thái
  const getStatusSortValue = (status: string): number => {
    switch (status) {
      case 'ACTIVE': return 1;
      case 'ON_HOLD': return 2;
      case 'COMPLETED': return 3;
      case 'CANCELLED': return 4;
      default: return 5;
    }
  };
  
  // Hàm định nghĩa giá trị sắp xếp cho các mức độ ưu tiên (giảm dần)
  const getPrioritySortValue = (priority: string): number => {
    switch (priority) {
      case 'URGENT': return 1;
      case 'HIGH': return 2;
      case 'MEDIUM': return 3;
      case 'LOW': return 4;
      default: return 5;
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      console.log('Fetching projects...');
      
      // Kiểm tra token trước khi gọi API
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available for API call');
        message.error('Authentication required. Please log in again.');
        return;
      }
      
      const res = await axiosInstance.get('/projects');
      console.log('Projects data response:', res.data);
      
      // Kiểm tra dữ liệu trả về
      let projectsData = [];
      if (res.data && Array.isArray(res.data)) {
        projectsData = res.data;
      } else if (res.data && res.data.projects && Array.isArray(res.data.projects)) {
        projectsData = res.data.projects;
      } else {
        console.warn('Unexpected projects data format:', res.data);
      }
      
      // Xử lý dữ liệu để đảm bảo các trường hiển thị đúng
      const processedProjects = projectsData.map((project: any) => {
        console.log('Raw project data:', project);
        
        // Kiểm tra chi tiết và log các trường quan trọng
        console.log('Project fields check:', {
          id: project.id,
          name: project.name,
          description: project.description !== undefined ? `has value: ${project.description?.substring(0, 20)}` : 'undefined',
          startDate: project.startDate || 'not set',
          endDate: project.endDate || 'not set',
          priority: project.priority || 'not set',
          status: project.status,
          members: Array.isArray(project.members) ? `${project.members.length} members` : 'no members array'
        });
        
        // Xử lý các trường ngày tháng cẩn thận hơn
        let startDate = null;
        if (project.startDate) {
          try {
            // Kiểm tra kỹ kiểu dữ liệu
            if (typeof project.startDate === 'string') {
              // Kiểm tra chuỗi rỗng
              if (project.startDate.trim()) {
                const momentDate = moment(project.startDate);
                if (momentDate.isValid()) {
                  startDate = project.startDate;
                  console.log('Valid startDate:', startDate);
                } else {
                  console.warn('Invalid startDate string:', project.startDate);
                }
              } else {
                console.warn('Empty startDate string');
              }
            } else if (project.startDate instanceof Date) {
              startDate = project.startDate;
              console.log('Valid startDate Date object:', startDate);
            } else {
              console.warn('Unknown startDate format:', project.startDate);
            }
          } catch (error) {
            console.error('Error processing startDate:', error, project.startDate);
          }
        } else {
          console.log('No startDate provided');
        }
        
        let endDate = null;
        if (project.endDate) {
          try {
            // Kiểm tra kỹ kiểu dữ liệu
            if (typeof project.endDate === 'string') {
              // Kiểm tra chuỗi rỗng
              if (project.endDate.trim()) {
                const momentDate = moment(project.endDate);
                if (momentDate.isValid()) {
                  endDate = project.endDate;
                  console.log('Valid endDate:', endDate);
                } else {
                  console.warn('Invalid endDate string:', project.endDate);
                }
              } else {
                console.warn('Empty endDate string');
              }
            } else if (project.endDate instanceof Date) {
              endDate = project.endDate;
              console.log('Valid endDate Date object:', endDate);
            } else {
              console.warn('Unknown endDate format:', project.endDate);
            }
          } catch (error) {
            console.error('Error processing endDate:', error, project.endDate);
          }
        } else {
          console.log('No endDate provided');
        }
        
        // Xử lý priority
        let priority = project.priority || 'MEDIUM';
        
        // Nếu chưa có priority nhưng có deadline, tính toán mức độ ưu tiên dựa trên thời gian còn lại
        if (!project.priority && project.status === 'ACTIVE' && endDate) {
          const daysToEnd = moment(endDate).diff(moment(), 'days');
          
          // Nếu còn ít hơn 30 ngày đến deadline
          if (daysToEnd <= 30) {
            priority = 'HIGH';
          } 
          // Nếu còn ít hơn 90 ngày đến deadline
          else if (daysToEnd <= 90) {
            priority = 'MEDIUM';
          } 
          // Nếu còn nhiều hơn 90 ngày
          else {
            priority = 'LOW';
          }
        }
        
        // Đảm bảo các trường quan trọng luôn có giá trị
        const processedProject = {
          ...project,
          // Không ép kiểu hoặc ghi đè description, chỉ lấy nguyên giá trị từ backend
          startDate: startDate,
          endDate: endDate,
          priority: priority,
          members: Array.isArray(project.members) ? project.members : []
        };
        
        console.log('Processed project:', processedProject);
        return processedProject;
      });
      
      // Sắp xếp dự án theo trạng thái và mức độ ưu tiên
      processedProjects.sort((a: { status: string; priority: string }, b: { status: string; priority: string }) => {
        // Sắp xếp trước tiên theo trạng thái
        const statusComparison = getStatusSortValue(a.status) - getStatusSortValue(b.status);
        if (statusComparison !== 0) return statusComparison;
        
        // Nếu cùng trạng thái, sắp xếp theo mức độ ưu tiên (giảm dần)
        return getPrioritySortValue(a.priority) - getPrioritySortValue(b.priority);
      });
      
      console.log('Processed and sorted projects:', processedProjects);
      setProjects(processedProjects);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      
      if (error.response?.status === 401) {
        console.log('401 error - redirecting to login');
        // Clear auth data and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      message.error(error.response?.data?.error || 'Không thể tải danh sách dự án!');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/users');
      console.log('Users data response:', res.data);
      
      // Kiểm tra dữ liệu trả về
      if (res.data && Array.isArray(res.data)) {
        setUsers(res.data);
      } else if (res.data && res.data.users && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      } else {
        console.warn('Unexpected users data format:', res.data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Không thể tải danh sách người dùng!');
      setUsers([]);
    }
  };

  // Fetch comments for a specific project
  const fetchComments = async (projectId: string) => {
    setCommentLoading(true);
    try {
      console.log('Fetching comments for project:', projectId);
      const res = await axiosInstance.get(`/projects/${projectId}/notes`);
      console.log('Comments API response:', res.data);
      setComments(res.data || []);
      console.log('Comments state updated:', res.data || []);
    } catch (e) {
      console.error('Error fetching project comments:', e);
      setComments([]);
    }
    setCommentLoading(false);
  };

  // Fetch comments for project detail (tách biệt)
  const fetchProjectDetailComments = async (projectId: string) => {
    setProjectCommentsLoading(prev => ({ ...prev, [projectId]: true }));
    try {
      const res = await axiosInstance.get(`/projects/${projectId}/notes`);
      setProjectComments(prev => ({ ...prev, [projectId]: res.data || [] }));
    } catch (e) {
      console.error('Error fetching project detail comments:', e);
      setProjectComments(prev => ({ ...prev, [projectId]: [] }));
    }
    setProjectCommentsLoading(prev => ({ ...prev, [projectId]: false }));
  };

  // Open comment drawer
  const openCommentDrawer = (project: any) => {
    if (!project || !project.id) {
      message.warning('Vui lòng chọn một dự án cụ thể để trao đổi ghi chú!');
      return;
    }
    setCommentProject(project);
    setCommentDrawerOpen(true);
    
    // Gọi API để lấy ghi chú khi mở drawer
    fetchComments(project.id);
    
    setTimeout(() => {
      const input = document.getElementById('project-comment-input');
      if (input) (input as HTMLTextAreaElement).focus();
    }, 300);
  };

  // Add comment
  const handleAddComment = async () => {
    if (!commentValue.trim() || !commentProject || !commentProject.id) return;
    setCommentLoading(true);
    try {
      await axiosInstance.post(`/projects/${commentProject.id}/notes`, {
        content: commentValue.trim()
      });
      setCommentValue('');
      fetchComments(commentProject.id);
      message.success('Đã thêm ghi chú!');
    } catch (e) {
      console.error('Error adding project comment:', e);
      message.error('Không thể thêm ghi chú!');
    }
    setCommentLoading(false);
  };
  
  const handleAdd = () => {
    console.log('Adding new project...');
    setEditingProject(null);
    form.setFieldsValue({
      name: '',
      description: '',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      startDate: null,
      endDate: null,
      memberIds: []
    });
    setModalOpen(true);
  };
  const handleEdit = (record: any) => {
    console.log('Editing project:', record);
    setEditingProject(record);
    
    // Xử lý ngày tháng
    const startDate = record.startDate ? moment(record.startDate) : null;
    const endDate = record.endDate ? moment(record.endDate) : null;
    
    // Xử lý danh sách thành viên
    let memberIds = [];
    if (record.members && Array.isArray(record.members)) {
      memberIds = record.members.map((member: any) => {
        if (member.userId) return member.userId;
        if (member.id) return member.id;
        return member;
      }).filter(Boolean);
    }
    
    console.log('Setting form values:', {
      ...record,
      startDate,
      endDate,
      memberIds
    });
    
    form.setFieldsValue({
      name: record.name || '',
      description: record.description || '',
      status: record.status || 'ACTIVE',
      startDate,
      endDate,
      memberIds
    });
    
    setModalOpen(true);
  };
  const handleOk = async () => {
    try {
      console.log('Starting form submission...');
      
      // Kiểm tra authentication trước khi submit
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available for form submission');
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/login';
        return;
      }
      
      // Thêm giá trị mặc định cho form trước khi validate
      const currentValues = form.getFieldsValue();
      console.log('Current form values:', currentValues);
      
      // XÓA ĐOẠN NÀY để không ghi đè giá trị người dùng nhập
      // form.setFieldsValue({
      //   name: currentValues.name || '',
      //   description: currentValues.description || '',
      //   status: currentValues.status || 'ACTIVE',
      //   priority: currentValues.priority || 'MEDIUM',
      //   startDate: currentValues.startDate || null,
      //   endDate: currentValues.endDate || null,
      //   memberIds: currentValues.memberIds || []
      // });
      
      // Validate form
      const values = await form.validateFields();
      console.log('DEBUG FORM VALUES:', values);
      
      // Kiểm tra và xử lý các trường bắt buộc
      if (!values.name || typeof values.name !== 'string' || values.name.trim().length < 3) {
        message.error('Tên dự án phải có ít nhất 3 ký tự và không được để trống!');
        return;
      }
      
      // Định dạng ngày tháng
      const formattedValues = {
        ...values,
        name: values.name?.trim(),
        description: values.description && typeof values.description === 'string' && values.description.trim() !== '' ? values.description.trim() : null,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
        priority: values.priority || 'MEDIUM',
        // Gửi đúng định dạng members cho backend: [{ userId, role }]
        members: (values.memberIds || []).map((userId: string) => {
          // Nếu đang sửa, lấy role cũ nếu có, mặc định là 'USER'
          let role = 'USER';
          if (editingProject && editingProject.members && Array.isArray(editingProject.members)) {
            const found = editingProject.members.find((m: any) => m.userId === userId || m.user?.id === userId);
            if (found && found.role) role = found.role;
          }
          return { userId, role };
        })
      };
      
      console.log('Sending project data:', formattedValues);
      
      if (editingProject) {
        const response = await axiosInstance.put(`/projects/${editingProject.id}`, formattedValues);
        console.log('Project update response:', response.data);
        message.success('Đã cập nhật dự án');
      } else {
        // Khi tạo mới, gửi members đúng định dạng
        const createValues = {
          ...formattedValues,
          members: (values.memberIds || []).map((userId: string) => ({ userId, role: 'USER' }))
        };
        const response = await axiosInstance.post('/projects', createValues);
        console.log('Project create response:', response.data);
        message.success('Đã tạo dự án');
      }
      setModalOpen(false);
      fetchProjects();
    } catch (e: any) {
      console.error('LỖI SUBMIT FORM:', e);
      console.error('Error details:', e.response?.data || e);
      
      // Kiểm tra lỗi authentication
      if (e.response?.status === 401) {
        console.log('401 error in form submission - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/login';
        return;
      }
      
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
      
      // Nếu là lỗi validate của antd form
      if (e && e.errorFields && Array.isArray(e.errorFields) && e.errorFields.length > 0) {
        message.error(e.errorFields[0].errors[0] || 'Vui lòng kiểm tra lại thông tin!');
      } else {
        message.error(e?.response?.data?.error || e?.message || 'Đã xảy ra lỗi!');
      }
    }
  };
  const handleDelete = async (id: string) => {
    try {
      console.log('Deleting project with ID:', id);
      const response = await axiosInstance.delete(`/projects/${id}`);
      console.log('Delete response:', response.data);
      message.success('Đã xóa dự án');
      fetchProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      console.error('Error response:', error.response?.data);
      message.error('Không thể xóa dự án. ' + (error.response?.data?.error || error.message));
    }
  };
  const showDetail = async (record: any) => {
    setDrawerOpen(true);
    setDetail(null);
    
    try {
      console.log('Fetching project details for ID:', record.id);
      const res = await axiosInstance.get(`/projects/${record.id}`);
      console.log('Project detail response:', res.data);
      console.log('Notes from API:', res.data.notes);
      
      const projectData = res.data;
      
      // Process the data
      const processedData = {
        ...projectData,
        startDate: projectData.startDate ? moment(projectData.startDate).format('DD/MM/YYYY') : null,
        endDate: projectData.endDate ? moment(projectData.endDate).format('DD/MM/YYYY') : null,
        members: Array.isArray(projectData.members) ? projectData.members : [],
        documents: Array.isArray(projectData.documents) ? projectData.documents : [],
        tasks: Array.isArray(projectData.tasks) ? projectData.tasks : [],
        images: Array.isArray(projectData.images) ? projectData.images : [],
        notes: Array.isArray(projectData.notes) ? projectData.notes : []
      };
      
      setDetail(processedData);
      
      // Cập nhật projectComments từ dữ liệu API response
      if (projectData.notes && Array.isArray(projectData.notes) && projectData.notes.length > 0) {
        console.log('Setting project comments from API response:', projectData.notes);
        setProjectComments(prev => ({ ...prev, [record.id]: projectData.notes }));
      } else {
        console.log('No notes in API response, calling fetchProjectDetailComments');
        // Nếu không có notes trong response, gọi API riêng
        fetchProjectDetailComments(record.id);
      }
      
    } catch (error) {
      console.error('Error fetching project details:', error);
      message.error('Không thể tải chi tiết dự án!');
    }
  };
  const handleAddNote = async (values: any) => {
    await axiosInstance.post(`/projects/${detail.id}/note`, { ...values, authorId: users[0]?.id });
    message.success('Đã thêm ghi chú');
    noteForm.resetFields();
    showDetail(detail);
  };
  const handleUpload = async (info: any) => {
    if (info.file.status === 'uploading') { setImgLoading(true); return; }
    if (info.file.status === 'done') {
      setImgLoading(false);
      message.success('Đã upload ảnh');
      showDetail(detail);
    }
  };

  // Hàm lấy màu ưu tiên
  const getPriorityColor = (priority: string) => {
    const priorityItem = priorityLevels.find(p => p.value === priority);
    return priorityItem ? priorityItem.color : 'default';
  };

  // Hàm lấy tên ưu tiên
  const getPriorityLabel = (priority: string) => {
    const priorityItem = priorityLevels.find(p => p.value === priority);
    return priorityItem ? priorityItem.label : 'Không';
  };

  // Hàm lấy icon trạng thái
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      case 'COMPLETED':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'ON_HOLD':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'CANCELLED':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  // Hàm lấy tên trạng thái
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang hoạt động';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'ON_HOLD':
        return 'Tạm dừng';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  // Hàm lọc dự án theo mức độ ưu tiên
  const filterProjectsByPriority = (projects: any[]) => {
    if (!priorityFilter) return projects;
    return projects.filter(project => project.priority === priorityFilter);
  };

  // Hàm lọc dự án dựa trên các bộ lọc
  const getFilteredProjects = () => {
    if (!projects || !Array.isArray(projects)) return [];
    
    return projects.filter(project => {
      // Lọc theo ưu tiên
      if (priorityFilter && project.priority !== priorityFilter) {
        return false;
      }
      
      // Lọc theo trạng thái
      if (statusFilter && project.status !== statusFilter) {
        return false;
      }
      
      // Lọc theo từ khóa tìm kiếm (tên dự án hoặc mô tả)
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const nameMatch = project.name && project.name.toLowerCase().includes(searchLower);
        const descMatch = project.description && project.description.toLowerCase().includes(searchLower);
        
        if (!nameMatch && !descMatch) {
          return false;
        }
      }
      
      // Lọc theo khoảng thời gian
      if (dateRangeFilter[0] || dateRangeFilter[1]) {
        const startDate = dateRangeFilter[0];
        const endDate = dateRangeFilter[1];
        
        // Nếu có ngày bắt đầu lọc và dự án có ngày bắt đầu
        if (startDate && project.startDate) {
          const projectStartDate = moment(project.startDate);
          if (projectStartDate.isBefore(startDate)) {
            return false;
          }
        }
        
        // Nếu có ngày kết thúc lọc và dự án có ngày bắt đầu
        if (endDate && project.startDate) {
          const projectStartDate = moment(project.startDate);
          if (projectStartDate.isAfter(endDate)) {
            return false;
          }
        }
      }
      
      return true;
    });
  };

  // Hàm render cho trường Ngày bắt đầu 
  const renderDate = (date: any) => {
    // In giá trị date để debug
    console.log('renderDate input:', date, typeof date);
    
    // Nếu không có giá trị hoặc giá trị là null hoặc undefined
    if (date === null || date === undefined) {
      console.log('Date is null or undefined');
      return '-';
    }
    
    try {
      // Kiểm tra kỹ kiểu dữ liệu
      if (typeof date === 'string') {
        // Nếu là chuỗi rỗng
        if (!date.trim()) {
          console.log('Date is empty string');
          return '-';
        }
        
        const momentDate = moment(date);
        if (!momentDate.isValid()) {
          console.warn('Invalid date string:', date);
          return '-';
        }
        console.log('Valid string date, formatted as:', momentDate.format('DD/MM/YYYY'));
        return momentDate.format('DD/MM/YYYY');
      }
      
      // Nếu đã là đối tượng Date
      if (date instanceof Date) {
        const momentDate = moment(date);
        console.log('Date object, formatted as:', momentDate.format('DD/MM/YYYY'));
        return momentDate.format('DD/MM/YYYY');
      }
      
      // Các trường hợp khác
      console.warn('Unknown date format:', date);
      return '-';
    } catch (err) {
      console.error('Error formatting date:', err, date);
      return '-';
    }
  };

  const columns = [
    {
      title: 'Tên dự án',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <span style={{
            display: 'inline-block',
            maxWidth: 200,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            verticalAlign: 'middle',
            fontWeight: 600,
            fontSize: 15
          }}>{text || '-'}</span>
        </Tooltip>
      )
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 320,
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <span style={{
            display: 'inline-block',
            maxWidth: 300,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            verticalAlign: 'middle',
            color: '#888',
            fontSize: 13
          }}>{text || '-'}</span>
        </Tooltip>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag icon={getStatusIcon(status)} color={
          status === 'ACTIVE' ? 'blue' :
          status === 'COMPLETED' ? 'green' :
          status === 'ON_HOLD' ? 'gold' :
          status === 'CANCELLED' ? 'red' : 'default'
        }>
          {getStatusLabel(status)}
        </Tag>
      )
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: renderDate
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      render: renderDate
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityLabel(priority)}
        </Tag>
      )
    },
    {
      title: 'Thành viên',
      dataIndex: 'members',
      key: 'members',
      render: (ms: any[]) => {
        if (!ms || !Array.isArray(ms) || ms.length === 0) return '-';
        return ms.map(m => m.user?.name || m.name || '').filter(Boolean).join(', ') || '-';
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => showDetail(record)}>Chi tiết</Button>
          <Button type="link" onClick={() => handleEdit(record)}>Sửa</Button>
          <Tooltip title="Trao đổi/ghi chú">
            <Badge count={record._count?.notes || 0} size="small" style={record._count?.notes > 0 ? { backgroundColor: '#ff4d4f' } : {}}>
              <Button
                type="link"
                icon={<MessageOutlined />}
                onClick={() => openCommentDrawer(record)}
              >
                Bình luận
              </Button>
            </Badge>
          </Tooltip>
          <Popconfirm
            title="Xóa dự án này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Hàm render dự án dạng card
  const renderProjectCard = (project: any) => {
    // Xác định màu sắc cho card dựa vào priority
    const getPriorityColor = (priority: string) => {
      const priorityInfo = priorityLevels.find(p => p.value === priority);
      return priorityInfo ? priorityInfo.color : 'default';
    };
    
    // Xác định icon cho trạng thái
    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'ACTIVE':
          return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
        case 'COMPLETED':
          return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        case 'ON_HOLD':
          return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
        case 'CANCELLED':
          return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
        default:
          return null;
      }
    };
    
    // Xác định text cho trạng thái
    const getStatusText = (status: string) => {
      switch (status) {
        case 'ACTIVE':
          return 'Đang hoạt động';
        case 'COMPLETED':
          return 'Hoàn thành';
        case 'ON_HOLD':
          return 'Tạm dừng';
        case 'CANCELLED':
          return 'Đã hủy';
        default:
          return status;
      }
    };
    
    return (
      <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Tag
            style={{
              position: 'absolute',
              top: '-10px',
              left: '16px',
              zIndex: 1
            }}
            icon={getStatusIcon(project.status)}
            color={
              project.status === 'ACTIVE' ? 'blue' :
              project.status === 'COMPLETED' ? 'green' :
              project.status === 'ON_HOLD' ? 'gold' :
              project.status === 'CANCELLED' ? 'red' : 'default'
            }
          >
            {getStatusLabel(project.status)}
          </Tag>
          <Card
            hoverable
            title={project.name}
            extra={
              <Tag color={getPriorityColor(project.priority)}>
                {priorityLevels.find(p => p.value === project.priority)?.label || 'Không'}
              </Tag>
            }
            actions={[
              <Button type="link" onClick={() => showDetail(project)} key="detail">Chi tiết</Button>,
              <Button type="link" onClick={() => handleEdit(project)} key="edit">Sửa</Button>,
              <Popconfirm
                title="Xóa dự án này?"
                onConfirm={() => handleDelete(project.id)}
                okText="Có"
                cancelText="Không"
                key="delete"
              >
                <Button type="link" danger>Xóa</Button>
              </Popconfirm>
            ]}
            style={{
              borderRadius: 16,
              boxShadow: isDarkMode
                ? '0 4px 24px 0 rgba(0,0,0,0.35), 0 1.5px 6px 0 rgba(0,0,0,0.18)'
                : '0 4px 24px 0 rgba(24, 144, 255, 0.10), 0 1.5px 6px 0 rgba(0,0,0,0.06)',
              border: `2px solid ${
                project.status === 'ACTIVE' ? (isDarkMode ? '#177ddc' : '#1890ff') :
                project.status === 'COMPLETED' ? (isDarkMode ? '#49aa19' : '#52c41a') :
                project.status === 'ON_HOLD' ? (isDarkMode ? '#d89614' : '#faad14') :
                project.status === 'CANCELLED' ? (isDarkMode ? '#a61d24' : '#ff4d4f') :
                (isDarkMode ? '#434343' : '#e4e4e4')
              }`,
              transition: 'transform 0.2s cubic-bezier(.4,2,.6,1), box-shadow 0.2s',
              padding: 16,
              background: isDarkMode ? '#1f1f1f' : undefined
            }}
            bodyStyle={{
              borderRadius: 16,
              minHeight: 120,
              background: isDarkMode ? '#141414' : '#fafdff',
              transition: 'background 0.2s'
            }}
            className="project-card-highlight"
          >
            <div style={{ marginBottom: 8 }}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              <span>
                {project.startDate && moment(project.startDate).isValid()
                  ? moment(project.startDate).format('DD/MM/YYYY')
                  : '-'
                }
                {' → '}
                {project.endDate && moment(project.endDate).isValid()
                  ? moment(project.endDate).format('DD/MM/YYYY')
                  : '-'
                }
              </span>
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <TeamOutlined style={{ marginRight: 8 }} />
              <span>
                {project.members && Array.isArray(project.members) && project.members.length > 0
                  ? `${project.members.length} thành viên`
                  : 'Chưa có thành viên'
                }
              </span>
            </div>
            
            {project._count && (
              <div>
                <FileOutlined style={{ marginRight: 8 }} />
                <span>
                  {project._count.documents || 0} tài liệu, {project._count.tasks || 0} công việc
                </span>
              </div>
            )}
          </Card>
        </div>
      </Col>
    );
  };

  const renderProjectContent = (project: any) => {
    return (
      <div style={{ marginTop: '10px' }}>
        <div><strong>Mô tả:</strong> {project.description || '-'}</div>
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>Bắt đầu:</strong> {renderDate(project.startDate)}
          </div>
          <div>
            <strong>Kết thúc:</strong> {renderDate(project.endDate)}
          </div>
        </div>
      </div>
    );
  };
  
  // Hiển thị Card dự án cho chế độ Card
  const renderProjectCards = () => {
    return getFilteredProjects().map(project => (
      <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
        <ProjectCard
          project={project}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={showDetail}
          onRefresh={fetchProjects}
          isDarkMode={isDarkMode}
        />
      </Col>
    ));
  };

  // Component hiển thị bộ lọc
  const renderFilters = () => {
    return (
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Radio.Group
              value={viewMode}
              onChange={e => setViewMode(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="table">Bảng</Radio.Button>
              <Radio.Button value="card">Thẻ</Radio.Button>
            </Radio.Group>
          </Col>
          <Col>
            <Input.Search
              placeholder="Tìm kiếm dự án"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </Col>
          <Col>
            <Button onClick={() => setFilterDrawerVisible(true)}>
              Bộ lọc nâng cao
            </Button>
          </Col>
          <Col>
            <Button
              type="link"
              onClick={() => {
                setPriorityFilter(null);
                setStatusFilter(null);
                setSearchText('');
                setDateRangeFilter([null, null]);
              }}
            >
              Xóa bộ lọc
            </Button>
          </Col>
        </Row>
      </div>
    );
  };

  // Component Drawer hiển thị bộ lọc nâng cao
  const renderFilterDrawer = () => {
    return (
      <Drawer
        title="Bộ lọc nâng cao"
        placement="right"
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        width={300}
      >
        <Form layout="vertical">
          <Form.Item label="Mức độ ưu tiên">
            <Select
              value={priorityFilter}
              onChange={value => setPriorityFilter(value)}
              placeholder="Chọn mức độ ưu tiên"
              allowClear
              style={{ width: '100%' }}
            >
              {priorityLevels.map(priority => (
                <Option key={priority.value} value={priority.value}>
                  <Tag color={priority.color}>{priority.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Trạng thái">
            <Select
              value={statusFilter}
              onChange={value => setStatusFilter(value)}
              placeholder="Chọn trạng thái"
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="ACTIVE">Đang hoạt động</Option>
              <Option value="COMPLETED">Hoàn thành</Option>
              <Option value="ON_HOLD">Tạm dừng</Option>
              <Option value="CANCELLED">Đã hủy</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Khoảng thời gian">
            <DatePicker.RangePicker
              value={dateRangeFilter as any}
              onChange={dates => setDateRangeFilter(dates as [moment.Moment | null, moment.Moment | null])}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              block
              onClick={() => setFilterDrawerVisible(false)}
            >
              Áp dụng
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Thêm dự án</Button>
        {renderFilters()}
      </div>
      
      {renderFilterDrawer()}
      
      {viewMode === 'table' ? (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={getFilteredProjects()}
          loading={loading}
          bordered
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} dự án`,
            pageSizeOptions: ['10', '20', '50', '100'],
            defaultPageSize: 10
          }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {renderProjectCards()}
        </Row>
      )}
      
      <Modal open={modalOpen} title={editingProject ? 'Sửa dự án' : 'Thêm dự án'} onOk={handleOk} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'ACTIVE',
            description: '',
            memberIds: []
          }}
        >
          <Form.Item
            name="name"
            label="Tên dự án"
            rules={[
              { required: true, whitespace: true, message: 'Nhập tên dự án!' },
              { min: 3, message: 'Tên dự án phải có ít nhất 3 ký tự!' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea onChange={e => { console.log('Mô tả nhập:', e.target.value); }} />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Chọn trạng thái!' }]}>
            <Select>
              <Select.Option value="ACTIVE">Đang hoạt động</Select.Option>
              <Select.Option value="COMPLETED">Hoàn thành</Select.Option>
              <Select.Option value="ON_HOLD">Tạm dừng</Select.Option>
              <Select.Option value="CANCELLED">Đã hủy</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Mức độ ưu tiên">
            <Select placeholder="Chọn mức độ ưu tiên">
              {priorityLevels.map(priority => (
                <Option key={priority.value} value={priority.value}>
                  <Tag color={priority.color}>{priority.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="startDate" label="Ngày bắt đầu">
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày bắt đầu"
              popupStyle={{ zIndex: 1060 }}
              getPopupContainer={(trigger) => trigger.parentElement as HTMLElement}
            />
          </Form.Item>
          <Form.Item name="endDate" label="Ngày kết thúc">
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày kết thúc"
              popupStyle={{ zIndex: 1060 }}
              getPopupContainer={(trigger) => trigger.parentElement as HTMLElement}
            />
          </Form.Item>
          <Form.Item name="memberIds" label="Thành viên">
            <Select
              mode="multiple"
              options={users.map((u: any) => ({ value: u.id, label: u.name }))}
              placeholder="Chọn thành viên"
              filterOption={(input, option) =>
                option?.label?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              showSearch
              style={{ width: '100%' }}
              getPopupContainer={(trigger) => trigger.parentElement as HTMLElement}
            />
          </Form.Item>
        </Form>
      </Modal>
      
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width={700} title={detail?.name || 'Chi tiết dự án'}>
        {detail && (
          <div>
            <Title level={4}>Thông tin dự án</Title>
            <p><b>Tên dự án:</b> {detail.name || '-'}</p>
            <p><b>Mô tả:</b> {detail.description || '-'}</p>
            <p><b>Trạng thái:</b> {detail.status ? (
              detail.status === 'ACTIVE' ? 'Đang hoạt động' :
              detail.status === 'COMPLETED' ? 'Hoàn thành' :
              detail.status === 'ON_HOLD' ? 'Tạm dừng' :
              detail.status === 'CANCELLED' ? 'Đã hủy' : detail.status
            ) : '-'}</p>
            <p><b>Mức độ ưu tiên:</b> {detail.priority ? (
              <Tag color={priorityLevels.find(p => p.value === detail.priority)?.color || 'default'}>
                {priorityLevels.find(p => p.value === detail.priority)?.label || 'Không'}
              </Tag>
            ) : '-'}</p>
            <p><b>Ngày bắt đầu:</b> {detail.startDate && moment(detail.startDate).isValid() ? moment(detail.startDate).format('DD/MM/YYYY') : '-'}</p>
            <p><b>Ngày kết thúc:</b> {detail.endDate && moment(detail.endDate).isValid() ? moment(detail.endDate).format('DD/MM/YYYY') : '-'}</p>
            <p><b>Thành viên:</b> {detail.members && Array.isArray(detail.members) && detail.members.length > 0 ?
              detail.members.map((m: any) => m.user?.name || m.name || '').filter(Boolean).join(', ') : '-'}</p>
            
            <Tabs defaultActiveKey="documents">
              <TabPane tab="Tài liệu" key="documents">
                {detail.documents && Array.isArray(detail.documents) && detail.documents.length > 0 ? (
                  <List
                    dataSource={detail.documents}
                    renderItem={(doc: any) => (
                      <List.Item>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.name || 'Tài liệu'}</a>
                      </List.Item>
                    )}
                  />
                ) : <p>Chưa có tài liệu</p>}
              </TabPane>
              
              <TabPane tab="Công việc" key="tasks">
                {detail.tasks && Array.isArray(detail.tasks) && detail.tasks.length > 0 ? (
                  <List
                    dataSource={detail.tasks}
                    renderItem={(task: any) => (
                      <List.Item>{task.title || 'Công việc'}</List.Item>
                    )}
                  />
                ) : <p>Chưa có công việc</p>}
              </TabPane>
              
              <TabPane tab="Ảnh dự án" key="images">
                <Upload
                  action={`${axiosInstance.defaults.baseURL}/projects/${detail.id}/image`}
                  headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                  showUploadList={true}
                  onChange={handleUpload}
                  multiple={false}
                  withCredentials={true}
                  data={{ projectId: detail.id, uploadedById: users[0]?.id }}
                >
                  <Button icon={<UploadOutlined />} loading={imgLoading}>Upload ảnh</Button>
                </Upload>
                {detail.images && Array.isArray(detail.images) && detail.images.length > 0 ? (
                  <List
                    grid={{ gutter: 8, column: 4 }}
                    dataSource={detail.images}
                    renderItem={(img: any) => (
                      <List.Item>
                        <img src={img.url} alt="project" style={{ width: '100%', borderRadius: 8 }} />
                      </List.Item>
                    )}
                  />
                ) : <p style={{ marginTop: 8 }}>Chưa có ảnh</p>}
              </TabPane>
              
              <TabPane tab="Ghi chú" key="notes">
                <div style={{ 
                  height: 320, 
                  maxHeight: 400, 
                  overflowY: 'auto',
                  background: isDarkMode ? '#18191c' : '#fff',
                  borderRadius: 8,
                  padding: 12
                }}>
                  {projectCommentsLoading[detail.id] ? (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      height: 200,
                      color: isDarkMode ? '#fff' : '#222'
                    }}>
                      <div>Đang tải ghi chú...</div>
                    </div>
                  ) : (
                    <List
                      dataSource={projectComments[detail.id] || []}
                      locale={{ 
                        emptyText: (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: 20,
                            color: isDarkMode ? '#aaa' : '#888'
                          }}>
                            <div style={{ fontSize: 16, marginBottom: 8 }}>📝</div>
                            <div>Chưa có ghi chú nào</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>
                              Sử dụng nút "Bình luận" ở mục hành động để thêm ghi chú
                            </div>
                          </div>
                        )
                      }}
                      renderItem={(item: any) => (
                        <List.Item style={{
                          background: item.user?.id === (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : '') ? 
                            (isDarkMode ? '#223355' : '#e6f7ff') : 
                            (isDarkMode ? '#232428' : '#fff'),
                          color: isDarkMode ? '#fff' : '#222',
                          borderBottom: isDarkMode ? '1px solid #222' : '1px solid #f0f0f0',
                          borderRadius: 8,
                          margin: '8px 0',
                          padding: '12px',
                          boxShadow: isDarkMode ? '0 2px 8px #0002' : '0 2px 8px #0001',
                          transition: 'all 0.2s ease'
                        }}>
                          <List.Item.Meta
                            avatar={
                              <Avatar 
                                icon={<UserOutlined />} 
                                style={{ 
                                  background: isDarkMode ? '#222' : undefined,
                                  border: isDarkMode ? '1px solid #333' : '1px solid #f0f0f0'
                                }} 
                              />
                            }
                            title={
                              <span style={{ 
                                color: isDarkMode ? '#fff' : '#222',
                                fontWeight: 600,
                                fontSize: 14
                              }}>
                                {item.user?.name || 'Người dùng'}
                              </span>
                            }
                            description={
                              <span style={{ 
                                color: isDarkMode ? '#aaa' : '#555',
                                fontSize: 13,
                                lineHeight: 1.5,
                                wordBreak: 'break-word'
                              }}>
                                {item.content}
                              </span>
                            }
                          />
                          <div style={{ 
                            fontSize: 11, 
                            color: isDarkMode ? '#aaa' : '#888',
                            marginTop: 8,
                            textAlign: 'right'
                          }}>
                            {moment(item.createdAt).format('DD/MM/YYYY HH:mm')}
                          </div>
                        </List.Item>
                      )}
                      style={{ background: 'transparent' }}
                    />
                  )}
                </div>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>
      
      {/* Project Comments Drawer */}
      <Drawer
        title={`Ghi chú cho dự án: ${commentProject?.name || ''}`}
        placement="right"
        width={400}
        onClose={() => setCommentDrawerOpen(false)}
        open={commentDrawerOpen}
        destroyOnClose
        bodyStyle={{
          background: isDarkMode ? '#18191c' : '#fff',
          color: isDarkMode ? '#fff' : '#222',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
        headerStyle={{
          background: isDarkMode ? '#18191c' : '#fff',
          color: isDarkMode ? '#fff' : '#222',
          borderBottom: isDarkMode ? '1px solid #333' : '1px solid #f0f0f0'
        }}
      >
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, minHeight: 200 }}>
          <List
            loading={commentLoading}
            dataSource={comments}
            locale={{ emptyText: 'Chưa có ghi chú nào.' }}
            renderItem={(item: any) => (
              <List.Item style={{
                background: item.user?.id === (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : '') ? (isDarkMode ? '#223355' : '#e6f7ff') : (isDarkMode ? '#232428' : '#fff'),
                color: isDarkMode ? '#fff' : '#222',
                borderBottom: isDarkMode ? '1px solid #222' : '1px solid #f0f0f0',
                borderRadius: 6,
                margin: '4px 0',
                boxShadow: isDarkMode ? '0 1px 2px #0002' : '0 1px 2px #0001'
              }}>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} style={{ background: isDarkMode ? '#222' : undefined }} />}
                  title={<span style={{ color: isDarkMode ? '#fff' : '#222' }}>{item.user?.name || 'Người dùng'}</span>}
                  description={<span style={{ color: isDarkMode ? '#aaa' : '#555' }}>{item.content}</span>}
                />
                <div style={{ fontSize: 11, color: isDarkMode ? '#aaa' : '#888' }}>{moment(item.createdAt).format('DD/MM/YYYY HH:mm')}</div>
              </List.Item>
            )}
            style={{ background: 'transparent' }}
          />
        </div>
        <div style={{
          borderTop: isDarkMode ? '1px solid #222' : '1px solid #f0f0f0',
          background: isDarkMode ? '#18191c' : '#fff',
          padding: 12,
          position: 'sticky',
          bottom: 0,
          zIndex: 2
        }}>
          <Mentions
            rows={3}
            placeholder="Nhập ghi chú trao đổi..."
            value={commentValue}
            onChange={val => setCommentValue(val)}
            style={{ background: isDarkMode ? '#232428' : '#fff', color: isDarkMode ? '#fff' : '#222', borderColor: isDarkMode ? '#333' : undefined }}
            onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
            autoSize={{ minRows: 3, maxRows: 6 }}
            prefix="@"
            notFoundContent={null}
            loading={commentLoading}
            options={users.map(user => ({
              value: user.id,
              label: user.name
            }))}
          />
          <Button
            type="primary"
            onClick={handleAddComment}
            loading={commentLoading}
            disabled={!commentValue.trim()}
            style={{ marginTop: 8, background: isDarkMode ? '#223355' : undefined, color: isDarkMode ? '#fff' : undefined, border: isDarkMode ? 'none' : undefined }}
            block
          >
            Gửi ghi chú
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default Project; 