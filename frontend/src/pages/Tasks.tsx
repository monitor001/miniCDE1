// Updated with authentication fixes - v3 - Build timestamp: 2024-12-19 15:30:00
import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Space, 
  Popconfirm, 
  message, 
  Tooltip, 
  Drawer, 
  List,
  Card,
  Row,
  Col,
  Statistic,
  Badge,
  Avatar,
  Typography,
  Divider,
  Empty,
  Switch,
  Radio,
  Slider
} from 'antd';
import axiosInstance from '../axiosConfig';
import moment from 'moment';
import 'moment/locale/vi';
import { useOutletContext } from 'react-router-dom';
import io from 'socket.io-client';
// @ts-ignore
import { debounce } from 'lodash';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  type DropResult 
} from '@hello-pangea/dnd';
import { 
  HistoryOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  TableOutlined,
  UnorderedListOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  MinusOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { ViewMode, Gantt, Task as GanttTask } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Resizable } from 'react-resizable';

// Error Boundary Component for Gantt
class GanttErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Gantt Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Empty 
            description={
              <div>
                <p>Có lỗi xảy ra khi hiển thị biểu đồ Gantt</p>
                <p style={{ fontSize: 12, color: '#999' }}>
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// Extend GanttTask interface to support additional properties
interface ExtendedGanttTask extends GanttTask {
  parent?: string;
  assignee?: string;
  priority?: string;
  status?: string;
}

const { Option } = Select;
const { Text, Title } = Typography;

const statusColors: any = {
  'TODO': 'default',
  'IN_PROGRESS': 'processing',
  'REVIEW': 'warning',
  'COMPLETED': 'success',
};

const priorityColors: any = {
  'LOW': 'blue',
  'MEDIUM': 'orange',
  'HIGH': 'red',
  'URGENT': 'red',
};

const statusList = [
  { value: 'TODO', label: 'Chờ thực hiện' },
  { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { value: 'REVIEW', label: 'Đang xem xét' },
  { value: 'COMPLETED', label: 'Hoàn thành' }
];

const priorityList = [
  { value: 'LOW', label: 'Thấp' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HIGH', label: 'Cao' },
  { value: 'URGENT', label: 'Khẩn cấp' }
];

const categoryList = [
  { value: 'DESIGN', label: 'Thiết kế' },
  { value: 'SURVEY', label: 'Khảo sát' },
  { value: 'BVTKTC', label: 'BVTKTC' },
  { value: 'DEVELOPMENT', label: 'Phát triển' },
  { value: 'TESTING', label: 'Kiểm thử' },
  { value: 'DOCUMENTATION', label: 'Tài liệu' },
  { value: 'MEETING', label: 'Họp' },
  { value: 'OTHER', label: 'Khác' }
];

// Updated with authentication fixes - v2
const Tasks: React.FC = () => {
  // Cấu hình moment locale cho tiếng Việt
  useEffect(() => {
    moment.locale('vi');
  }, []);

  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [form] = Form.useForm();
  const outletContext = useOutletContext<{ role?: string }>() || {};
  const role = outletContext.role || '';
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [filter, setFilter] = useState<{
    search: string;
    status: string;
    priority: string;
    projectId: string;
    assignee: string;
  }>({ 
    search: '', 
    status: 'all',
    priority: 'all',
    projectId: 'all',
    assignee: 'all'
  });
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentForm] = Form.useForm();
  const [commentLoading, setCommentLoading] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState<any>(null);
  const [socket, setSocket] = useState<any>(null);
  const [projectComments, setProjectComments] = useState<{ [key: string]: any[] }>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [kanbanTasks, setKanbanTasks] = useState<{ [key: string]: any[] }>({});
  
  // State cho tùy chỉnh Gantt timeline
  const [ganttColumnWidth, setGanttColumnWidth] = useState(20);
  const [ganttListCellWidth, setGanttListCellWidth] = useState(250);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [ganttSettingsVisible, setGanttSettingsVisible] = useState(false);
  const [ganttViewMode, setGanttViewMode] = useState(ViewMode.Week);
  const [ganttZoom, setGanttZoom] = useState(1);
  
  const theme = useSelector((state: any) => state.ui.theme);
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const fetchTasks = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      
      if (filter.search) params.append('search', filter.search);
      if (filter.status && filter.status !== 'all') params.append('status', filter.status);
      if (filter.priority && filter.priority !== 'all') params.append('priority', filter.priority);
      if (filter.assignee && filter.assignee !== 'all') params.append('assignee', filter.assignee);
      if (filter.projectId && filter.projectId !== 'all') params.append('projectId', filter.projectId);

      const res = await axiosInstance.get(`/tasks?${params}`);
      
      if (res.data.tasks) {
        setTasks(res.data.tasks);
        setPagination({
          current: res.data.pagination.page,
          pageSize: res.data.pagination.limit,
          total: res.data.pagination.total
        });
      } else {
        setTasks(res.data);
      }
    } catch (e) {
      console.error('Lỗi fetchTasks:', e);
      message.error('Không thể tải danh sách công việc!');
      setTasks([]);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      console.log('🔍 Fetching users from database...');
      const response = await axiosInstance.get('/users/all');
      console.log('📊 Users API response:', response.data);
      
      // Kiểm tra dữ liệu trả về
      let usersData = [];
      if (response.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && response.data.users && Array.isArray(response.data.users)) {
        usersData = response.data.users;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        usersData = response.data.data;
        } else {
        console.warn('⚠️ Unexpected users data format:', response.data);
        usersData = [];
      }
      
      console.log('✅ Processed users data:', usersData);
      console.log('👥 Number of users loaded:', usersData.length);
      setUsers(usersData);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
        message.error('Không thể tải danh sách người dùng!');
        setUsers([]);
    }
  };

  const fetchProjects = async () => {
    try {
      console.log('🔍 Fetching projects from database...');
      const response = await axiosInstance.get('/projects');
      console.log('📊 Projects API response:', response.data);
      
      // Kiểm tra dữ liệu trả về
      let projectsData = [];
      if (response.data && Array.isArray(response.data)) {
        projectsData = response.data;
      } else if (response.data && response.data.projects && Array.isArray(response.data.projects)) {
        projectsData = response.data.projects;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        projectsData = response.data.data;
      } else {
        console.warn('⚠️ Unexpected projects data format:', response.data);
        projectsData = [];
      }
      
      console.log('✅ Processed projects data:', projectsData);
      console.log('🏗️ Number of projects loaded:', projectsData.length);
      setProjects(projectsData);
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      message.error('Không thể tải danh sách dự án!');
      setProjects([]);
    }
  };

  // Fetch comments for a task
  const fetchComments = async (taskId: string) => {
    setCommentLoading(true);
    try {
      const res = await axiosInstance.get(`/tasks/${taskId}`);
      console.log('API /tasks/:id response:', res.data);
      setComments(res.data.comments || []);
    } catch (e) {
      setComments([]);
    }
    setCommentLoading(false);
  };

  const openCommentDrawer = (task: any) => {
    setSelectedTask(task);
    setCommentDrawerOpen(true);
    fetchComments(task.id);
  };

  const handleAddComment = async () => {
    try {
      const values = await commentForm.validateFields();
      setCommentLoading(true);
      await axiosInstance.post(`/tasks/${selectedTask.id}/comments`, {
        content: values.content
      });
      message.success('Đã thêm bình luận!');
      commentForm.resetFields();
      fetchComments(selectedTask.id);
    } catch (error) {
      message.error('Lỗi khi thêm bình luận!');
    } finally {
      setCommentLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 Tasks component mounted, loading data...');
    fetchTasks();
    fetchProjects();
    fetchUsers();
    
    // Cấu hình Socket.IO với URL chính xác
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'https://qlda.hoanglong24.com';
    console.log('Connecting to Socket.IO at:', socketUrl);
    
    try {
      const socket = io(socketUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      
      const showRealtimeToast = debounce((msg: string) => message.info(msg), 1000, { leading: true, trailing: false });
      const showCommentToast = debounce((msg: string) => message.info(msg), 1000, { leading: true, trailing: false });
      const showReminderToast = debounce((msg: string) => message.warning(msg), 1000, { leading: true, trailing: false });
      
      socket.on('connect', () => {
        console.log('Socket.IO connected successfully:', socket.id);
      });
      
      socket.on('connect_error', (error: Error) => {
        console.error('Socket.IO connection error:', error);
      });
      
      socket.on('task:created', (data: any) => {
        showRealtimeToast('Có công việc mới: ' + data.task.title);
        fetchTasks();
      });

      socket.on('task:updated', (data: any) => {
        showRealtimeToast('Công việc đã được cập nhật: ' + data.task.title);
        fetchTasks();
      });

      socket.on('task:deleted', (data: any) => {
        showRealtimeToast('Công việc đã được xóa');
        fetchTasks();
      });
      
      socket.on('task:comment:added', (data: any) => {
        showCommentToast('Có bình luận mới cho công việc!');
        fetchTasks();
      });
      
      socket.on('task:reminder', (data: any) => {
        showReminderToast(data.message);
      });
      
      return () => {
        socket.disconnect();
      };
    } catch (error) {
      console.error('Socket.IO setup error:', error);
    }
  }, []);

  // Debug effect for form data
  useEffect(() => {
    console.log('🏗️ Projects data updated:', projects);
    console.log('👥 Users data updated:', users);
  }, [projects, users]);

  useEffect(() => {
    if (projects.length > 0) {
      fetchUsers();
    }
  }, [projects]);

  useEffect(() => {
    fetchTasks(pagination.current, pagination.pageSize);
  }, [filter]);

  const handleEdit = (record: any) => {
    console.log('🔍 Editing task record:', record);
    console.log('👤 Assignee info:', record.assignee);
    console.log('🆔 Assignee ID:', record.assigneeId);
    
    setEditingTask(record);
    const formValues = {
      ...record,
      startDate: record.startDate ? moment(record.startDate) : null,
      dueDate: record.dueDate ? moment(record.dueDate) : null,
      assignee: record.assignee?.id || record.assigneeId || undefined,
      projectId: record.projectId,
      category: record.category || 'OTHER'
    };
    
    console.log('📝 Setting form values:', formValues);
    form.setFieldsValue(formValues);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/tasks/${id}`);
      message.success('Đã xóa công việc');
      fetchTasks();
    } catch (e) {
      message.error('Không thể xóa công việc');
    }
  };

  const handleAdd = () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('Vui lòng đăng nhập để tạo nhiệm vụ!');
      return;
    }
    
    console.log('Opening task creation modal - authentication check passed');
    setEditingTask(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOk = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        return;
      }
      
      console.log('🔍 Starting task submission...');
      const values = await form.validateFields();
      console.log('📊 Form values:', values);
      
      if (!values.title) {
        message.error('Vui lòng nhập tên công việc!');
        return;
      }
      
      if (!values.status) {
        message.error('Vui lòng chọn trạng thái!');
        return;
      }

      if (!values.projectId) {
        message.error('Vui lòng chọn dự án!');
        return;
      }
      
      const submitData = {
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority || 'MEDIUM',
        startDate: values.startDate ? values.startDate.format() : undefined,
        dueDate: values.dueDate ? values.dueDate.format() : undefined,
        assigneeId: values.assignee || undefined,
        projectId: values.projectId,
        category: values.category || 'OTHER'
      };

      console.log('📤 Submit data:', submitData);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');

      if (editingTask) {
        console.log('🔄 Updating task:', editingTask.id);
        await axiosInstance.put(`/tasks/${editingTask.id}`, submitData);
        message.success('Đã cập nhật công việc');
      } else {
        console.log('➕ Creating new task');
        const response = await axiosInstance.post('/tasks', submitData);
        console.log('✅ Task creation response:', response.data);
        message.success('Đã thêm công việc');
      }
      setModalOpen(false);
      fetchTasks();
    } catch (e: any) {
      console.error('❌ Error in handleOk:', e);
      console.error('❌ Error response:', e?.response?.data);
      
      // Handle specific authentication errors
      if (e?.response?.status === 401) {
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return;
      }
      
      // Handle validation errors
      if (e?.response?.status === 400) {
        const errorMessage = e?.response?.data?.error || 'Dữ liệu không hợp lệ';
        console.error('❌ Validation error:', errorMessage);
        message.error(errorMessage);
        return;
      }
      
      message.error(e?.response?.data?.error || e?.message || 'Có lỗi xảy ra khi tạo nhiệm vụ');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;
    
    const task = kanbanTasks[source.droppableId].find(t => t.id === draggableId);
    if (task) {
      try {
        await axiosInstance.put(`/tasks/${task.id}`, { ...task, status: destination.droppableId });
        message.success('Cập nhật trạng thái thành công!');
        fetchTasks();
      } catch (e) {
        message.error('Không thể cập nhật trạng thái');
      }
    }
  };

  const fetchHistory = async (id: string) => {
    try {
      const res = await axiosInstance.get(`/tasks/${id}/history`);
      setHistoryList(res.data);
    } catch (e) {
      console.error('Lỗi fetchHistory:', e);
      message.error('Không thể tải lịch sử!');
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  // Nâng cấp icon trạng thái
  const getStatusIcon = (status: string) => {
    let color = '#bfbfbf', icon = <ClockCircleOutlined style={{ fontSize: 20 }} />;
    switch (status) {
      case 'TODO': color = '#bfbfbf'; icon = <ClockCircleOutlined style={{ fontSize: 20, color: color }} />; break;
      case 'IN_PROGRESS': color = '#faad14'; icon = <ExclamationCircleOutlined style={{ fontSize: 20, color: color }} />; break;
      case 'REVIEW': color = '#1890ff'; icon = <ExclamationCircleOutlined style={{ fontSize: 20, color: color }} />; break;
      case 'COMPLETED': color = '#52c41a'; icon = <CheckCircleOutlined style={{ fontSize: 20, color: color }} />; break;
      default: break;
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: color + '22', marginRight: 4 }}>{icon}</span>;
  };

  // Sắp xếp dự án theo mức độ triển khai
  const getSortedProjects = () => {
    if (!Array.isArray(projects)) {
      console.warn('Projects is not an array:', projects);
      return [];
    }
    
    const statusOrder = {
      'ACTIVE': 1,      // Đang triển khai
      'PLANNING': 2,    // Đang lên kế hoạch
      'ON_HOLD': 3,     // Đang tạm dừng
      'COMPLETED': 4,   // Hoàn thành
      'ARCHIVED': 5     // Lưu trữ
    };

    return projects
      .filter(project => {
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        return projectTasks.length > 0; // Chỉ hiển thị dự án có nhiệm vụ
      })
      .sort((a, b) => {
      const statusA = statusOrder[a.status as keyof typeof statusOrder] || 999;
      const statusB = statusOrder[b.status as keyof typeof statusOrder] || 999;
      
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      
        // Nếu cùng trạng thái, sắp xếp theo tên dự án
      return a.name.localeCompare(b.name);
    });
  };

  // Sắp xếp nhiệm vụ theo thứ tự ưu tiên giảm dần
  const getSortedTasksForProject = (projectId: string) => {
    if (!Array.isArray(tasks)) {
      console.warn('Tasks is not an array:', tasks);
      return [];
    }
    
    const priorityOrder = {
      'URGENT': 1,
      'HIGH': 2,
      'MEDIUM': 3,
      'LOW': 4
    };

    return tasks
      .filter(task => task.projectId === projectId)
      .sort((a, b) => {
        // Sắp xếp theo priority trước
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 999;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 999;
        
        if (priorityA !== priorityB) {
      return priorityA - priorityB;
        }
        
        // Nếu cùng priority, sắp xếp theo dueDate
        if (a.dueDate && b.dueDate) {
          return moment(a.dueDate).diff(moment(b.dueDate));
        }
        
        // Nếu không có dueDate, sắp xếp theo tên
        return a.title.localeCompare(b.title);
    });
  };

  // Safe getGanttTasks function
  const getGanttTasks = (): ExtendedGanttTask[] => {
    try {
      // Return empty array if no data
      if (!Array.isArray(tasks) || tasks.length === 0) {
        console.log('No tasks available for Gantt');
        return [];
      }
      
      const ganttTasks: ExtendedGanttTask[] = [];
      const projectMap = new Map();
      
      // Group tasks by project
      tasks.forEach(task => {
        if (!task || !task.projectId) return;
        
        if (!projectMap.has(task.projectId)) {
          projectMap.set(task.projectId, {
            project: task.project,
            tasks: []
          });
        }
        
        projectMap.get(task.projectId).tasks.push(task);
      });
      
      // Create Gantt tasks
      projectMap.forEach((group, projectId) => {
        const { project, tasks: projectTasks } = group;
        
        if (!project || projectTasks.length === 0) return;
        
        // Add project
        const projectTask: ExtendedGanttTask = {
          id: `project-${projectId}`,
          name: project.name || 'Unnamed Project',
          start: new Date(),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          type: 'project',
          progress: 0,
          isDisabled: false,
          styles: {
            progressColor: '#1890ff',
            progressSelectedColor: '#096dd9',
            backgroundColor: '#1890ff',
            backgroundSelectedColor: '#096dd9'
          }
        };
        
        // Calculate project dates from tasks
        let minDate = new Date();
        let maxDate = new Date();
        let hasValidDates = false;
        let completedTasks = 0;
        
        projectTasks.forEach((task: any) => {
          if (task.status === 'COMPLETED') completedTasks++;
          
          if (task.startDate) {
            const startDate = new Date(task.startDate);
            if (!isNaN(startDate.getTime())) {
              if (!hasValidDates || startDate < minDate) minDate = startDate;
              hasValidDates = true;
            }
          }
          if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            if (!isNaN(dueDate.getTime())) {
              if (!hasValidDates || dueDate > maxDate) maxDate = dueDate;
              hasValidDates = true;
            }
          }
        });
        
        if (hasValidDates) {
          projectTask.start = minDate;
          projectTask.end = maxDate;
        }
        
        projectTask.progress = projectTasks.length > 0 
          ? Math.round((completedTasks / projectTasks.length) * 100)
          : 0;
        
        ganttTasks.push(projectTask);
        
        // Add child tasks
        projectTasks.forEach((task: any) => {
          if (!task.id || !task.title) return;
          
          const childTask: ExtendedGanttTask = {
            id: String(task.id),
            name: task.title,
            start: task.startDate ? new Date(task.startDate) : new Date(),
            end: task.dueDate ? new Date(task.dueDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
            type: 'task',
            progress: task.status === 'COMPLETED' ? 100 : 
                     task.status === 'IN_PROGRESS' ? 50 : 
                     task.status === 'REVIEW' ? 75 : 0,
            isDisabled: false,
            project: project.name,
            parent: `project-${projectId}`,
            styles: {
              progressColor: '#40a9ff',
              progressSelectedColor: '#1890ff',
              backgroundColor: '#40a9ff',
              backgroundSelectedColor: '#1890ff'
            }
          };
          
          // Ensure valid dates
          if (childTask.end <= childTask.start) {
            childTask.end = new Date(childTask.start.getTime() + 24 * 60 * 60 * 1000);
          }
          
          ganttTasks.push(childTask);
        });
      });
      
      console.log('Created Gantt tasks:', ganttTasks.length);
      return ganttTasks;
    } catch (error) {
      console.error('Error creating Gantt tasks:', error);
      return [];
    }
  };

  const columns = [
    {
      title: 'Tên công việc',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description.length > 50 
                ? `${record.description.substring(0, 50)}...` 
                : record.description}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => (
        date ? (
          <Space>
            <CalendarOutlined />
            <span>{moment(date).format('DD/MM/YYYY')}</span>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    },
    {
      title: 'Phân loại',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue">
          {categoryList.find(c => c.value === category)?.label || category || 'Khác'}
        </Tag>
      )
    },
    {
      title: 'Người thực hiện',
      dataIndex: ['assignee', 'name'],
      key: 'assignee',
      render: (text: string, record: any) => (
        text ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <span>{text}</span>
          </Space>
        ) : (
          <Text type="secondary">Chưa phân công</Text>
        )
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge 
          status={statusColors[status] as any} 
          text={statusList.find(s => s.value === status)?.label || status}
        />
      )
    },
    {
      title: 'Độ ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priorityColors[priority]}>
          {priorityList.find(p => p.value === priority)?.label || priority}
        </Tag>
      )
    },
    {
      title: 'Hạn hoàn thành',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => (
        date ? (
          <Space>
            <CalendarOutlined />
            <span>{moment(date).format('DD/MM/YYYY')}</span>
          </Space>
        ) : (
          <Text type="secondary">Không có hạn</Text>
        )
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button 
            size="small" 
            icon={<HistoryOutlined />}
            onClick={() => fetchHistory(record.id)}
          >
            Lịch sử
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa nhiệm vụ này?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      )
    },
    {
      title: 'Ghi chú',
      key: 'comments',
      render: (_: any, record: any) => (
        <Tooltip title="Trao đổi/ghi chú">
          <Badge count={record._count?.comments || 0} size="small">
            <Button
              shape="circle"
              icon={<MessageOutlined />}
              onClick={() => openCommentDrawer(record)}
              size="small"
            />
          </Badge>
        </Tooltip>
      )
    }
  ];

  // 1. Table cha chỉ hiển thị tên dự án
  const parentColumns = [
    {
      title: '',
      dataIndex: 'project',
      key: 'project',
      render: (_: any, record: any) => (
        <span style={{ fontWeight: 600, fontSize: 16 }}>
          <Tag color="blue" style={{ fontSize: 15 }}>{record.project.name}</Tag>
        </span>
      )
    }
  ];

  // 2. Table con: không có cột dự án, cột tên công việc rộng hơn
  const childColumns = [
    {
      title: 'Tên công việc',
      dataIndex: 'title',
      key: 'title',
      width: '28%',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 15 }}>{text}</div>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description.length > 80 
                ? `${record.description.substring(0, 80)}...` 
                : record.description}
            </Text>
          )}
        </div>
      )
    },
    ...columns.filter(col => col.key !== 'project' && col.key !== 'title').map(col =>
      col.key === 'comments' ? {
        ...col,
        render: (_: any, record: any) => (
          <Tooltip title="Trao đổi/ghi chú">
            <Badge count={record._count?.comments || 0} size="small" style={record._count?.comments > 0 ? { backgroundColor: '#ff4d4f' } : {}}>
              <Button
                shape="circle"
                icon={<MessageOutlined />}
                onClick={() => openCommentDrawer(record)}
                size="small"
              />
            </Badge>
          </Tooltip>
        )
      } : col
    )
  ];

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    review: tasks.filter(t => t.status === 'REVIEW').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    overdue: tasks.filter(t => t.dueDate && moment(t.dueDate).isBefore(moment(), 'day')).length
  };

  // Nhóm tasks theo projectId với sắp xếp
  const groupedTasks = getSortedProjects().map(project => ({
    key: project.id,
    project,
    tasks: getSortedTasksForProject(project.id),
  })).filter(g => g.tasks.length > 0);

  // Hàm xuất PDF cho chế độ bảng
  const handleExportTable = () => {
    const doc = new jsPDF();
    const tableData = tasks.map((task, idx) => [
      idx + 1,
      task.title,
      task.project?.name || '',
      task.assignee?.name || '',
      task.status,
      task.priority,
      task.dueDate ? moment(task.dueDate).format('DD/MM/YYYY') : ''
    ]);
    autoTable(doc, {
      head: [['#', 'Tên nhiệm vụ', 'Dự án', 'Người thực hiện', 'Trạng thái', 'Ưu tiên', 'Hạn hoàn thành']],
      body: tableData,
    });
    doc.save('tasks-report.pdf');
  };
  // Hàm xuất hình ảnh cho chế độ Gantt
  const handleExportGantt = async () => {
    const ganttEl = document.querySelector('.gantt-container');
    if (ganttEl) {
      const canvas = await html2canvas(ganttEl as HTMLElement);
      const link = document.createElement('a');
      link.download = 'tasks-gantt.png';
      link.href = canvas.toDataURL();
      link.click();
    } else {
      message.error('Không tìm thấy biểu đồ Gantt để xuất!');
    }
  };

  const getStatusCount = (status: string) => {
    if (!Array.isArray(tasks)) {
      console.warn('Tasks is not an array:', tasks);
      return 0;
    }
    if (status === 'all') return tasks.length;
    return tasks.filter(task => task.status === status).length;
  };

  const getFilteredTasks = () => {
    if (!Array.isArray(tasks)) {
      console.warn('Tasks is not an array:', tasks);
      return [];
    }
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(filter.search.toLowerCase()) ||
                           task.description.toLowerCase().includes(filter.search.toLowerCase());
      const matchesStatus = filter.status === 'all' || task.status === filter.status;
      const matchesPriority = filter.priority === 'all' || task.priority === filter.priority;
      const matchesProject = filter.projectId === 'all' || task.projectId === filter.projectId;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });
  };

  // Hàm xử lý thu nhỏ/mở rộng dự án
  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // Hàm mở rộng tất cả dự án
  const expandAllProjects = () => {
    const projectIds = Array.from(new Set(tasks.map(task => task.projectId)));
    setExpandedProjects(new Set(projectIds));
  };

  // Hàm thu nhỏ tất cả dự án
  const collapseAllProjects = () => {
    setExpandedProjects(new Set());
  };

  const ResizableAny = Resizable as any;

  // Auto-expand projects when zooming in for better UX
  useEffect(() => {
    if (ganttZoom > 1.2) {
      // Auto-expand all projects when zoomed in
      const allProjectIds = projects.map(p => p.id);
      setExpandedProjects(new Set(allProjectIds));
    }
  }, [ganttZoom, projects]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>Quản lý công việc</Title>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm công việc
            </Button>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={4}>
            <Card>
              <Statistic title="Tổng cộng" value={taskStats.total} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Chờ thực hiện" 
                value={taskStats.todo} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Đang thực hiện" 
                value={taskStats.inProgress} 
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Đang xem xét" 
                value={taskStats.review} 
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Hoàn thành" 
                value={taskStats.completed} 
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Quá hạn" 
                value={taskStats.overdue} 
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Tìm kiếm">
              <Input
                  placeholder="Tìm kiếm nhiệm vụ..."
                value={filter.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                  prefix={<SearchOutlined />}
              />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Trạng thái">
              <Select
                  placeholder="Tất cả trạng thái"
                value={filter.status}
                onChange={(value) => handleFilterChange('status', value)}
                allowClear
                style={{ width: '100%' }}
              >
                  <Option value="all">Tất cả</Option>
                {statusList.map(status => (
                  <Option key={status.value} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Ưu tiên">
              <Select
                  placeholder="Tất cả ưu tiên"
                value={filter.priority}
                onChange={(value) => handleFilterChange('priority', value)}
                allowClear
                style={{ width: '100%' }}
              >
                  <Option value="all">Tất cả</Option>
                {priorityList.map(priority => (
                  <Option key={priority.value} value={priority.value}>
                    {priority.label}
                  </Option>
                ))}
              </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Dự án">
              <Select
                  placeholder="Tất cả dự án"
                  value={filter.projectId}
                  onChange={(value) => handleFilterChange('projectId', value)}
                allowClear
                style={{ width: '100%' }}
              >
                  <Option value="all">Tất cả</Option>
                  {projects.map(project => (
                    <Option key={project.id} value={project.id}>
                      {project.name}
                  </Option>
                ))}
              </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Người thực hiện">
              <Select
                  placeholder="Tất cả người dùng"
                  value={filter.assignee}
                  onChange={(value) => handleFilterChange('assignee', value)}
                allowClear
                style={{ width: '100%' }}
              >
                  <Option value="all">Tất cả</Option>
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </Option>
                  ))}
              </Select>
              </Form.Item>
            </Col>
            <Col span={2}>
              <Form.Item label=" ">
              <Button 
                icon={<FilterOutlined />}
                onClick={() => {
                    setFilter({ search: '', status: 'all', priority: 'all', assignee: 'all', projectId: 'all' });
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
              >
                Reset
              </Button>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Task Table */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card>
              <Row gutter={16} align="middle">
                <Col>
                  <Text strong>Chế độ xem:</Text>
                </Col>
                <Col>
                  <Radio.Group 
                    value={viewMode} 
                    onChange={(e) => setViewMode(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="table">
                      <TableOutlined /> Bảng
                    </Radio.Button>
                    <Radio.Button value="timeline">
                      <BarChartOutlined /> Gantt Timeline
                    </Radio.Button>
                  </Radio.Group>
                </Col>
              </Row>
            </Card>
          </Col>
          {viewMode === 'timeline' && (
            <Col span={12}>
              <Card>
                <Row gutter={16} align="middle">
                  <Col>
                    <Text strong>Tùy chỉnh:</Text>
                  </Col>
                  <Col>
                    <Button 
                      size="small" 
                      icon={<PlusOutlined />} 
                      onClick={expandAllProjects}
                      style={{ marginRight: 8 }}
                    >
                      Mở rộng tất cả
                    </Button>
                    <Button 
                      size="small" 
                      icon={<MinusOutlined />} 
                      onClick={collapseAllProjects}
                      style={{ marginRight: 8 }}
                    >
                      Thu nhỏ tất cả
                    </Button>
                    <Button 
                      size="small" 
                      icon={<SettingOutlined />} 
                      onClick={() => setGanttSettingsVisible(true)}
                      style={{ marginRight: 8 }}
                    >
                      Cài đặt
                    </Button>
                    <Radio.Group 
                      value={ganttViewMode} 
                      onChange={(e) => setGanttViewMode(e.target.value)}
                      size="small"
                      style={{ marginRight: 8 }}
                    >
                      <Radio.Button value={ViewMode.Day}>Ngày</Radio.Button>
                      <Radio.Button value={ViewMode.Week}>Tuần</Radio.Button>
                      <Radio.Button value={ViewMode.Month}>Tháng</Radio.Button>
                      <Radio.Button value={ViewMode.Year}>Năm</Radio.Button>
                    </Radio.Group>
                    <Slider
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={ganttZoom}
                      onChange={setGanttZoom}
                      style={{ width: 100, marginRight: 8 }}
                      tooltip={{ formatter: (value) => `${Math.round((value || 1) * 100)}%` }}
                    />
                    <Button 
                      size="small" 
                      icon={<PlusOutlined />} 
                      onClick={() => setGanttZoom(Math.min(2, ganttZoom + 0.1))}
                      style={{ marginRight: 4 }}
                      disabled={ganttZoom >= 2}
                    />
                    <Button 
                      size="small" 
                      icon={<MinusOutlined />} 
                      onClick={() => setGanttZoom(Math.max(0.5, ganttZoom - 0.1))}
                      style={{ marginRight: 8 }}
                      disabled={ganttZoom <= 0.5}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          )}
        </Row>

        {viewMode === 'table' ? (
          <Card>
        <Table
              dataSource={getSortedProjects()}
              loading={loading}
              pagination={false}
          expandable={{
                expandedRowRender: (project) => {
                  const projectTasks = getSortedTasksForProject(project.id);
                  return (
              <Table
                      dataSource={projectTasks}
                pagination={false}
                      size="small"
                      columns={[
                        {
                          title: 'Nhiệm vụ',
                          dataIndex: 'title',
                          key: 'title',
                          render: (text, record) => (
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{text}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {record.description}
                              </div>
                            </div>
                          )
                        },
                        {
                          title: 'Ngày bắt đầu',
                          dataIndex: 'startDate',
                          key: 'startDate',
                          render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-'
                        },
                        {
                          title: 'Hạn hoàn thành',
                          dataIndex: 'dueDate',
                          key: 'dueDate',
                          render: (dueDate) => dueDate ? moment(dueDate).format('DD/MM/YYYY') : 'Chưa có'
                        },
                        {
                          title: 'Phân loại',
                          dataIndex: 'category',
                          key: 'category',
                          render: (category) => (
                            <Tag color="blue">
                              {categoryList.find(c => c.value === category)?.label || category || 'Khác'}
                            </Tag>
                          )
                        },
                        {
                          title: 'Trạng thái',
                          dataIndex: 'status',
                          key: 'status',
                          render: (status) => (
                            <Tag color={statusColors[status]}>
                              {statusList.find(s => s.value === status)?.label || status}
                            </Tag>
                          )
                        },
                        {
                          title: 'Ưu tiên',
                          dataIndex: 'priority',
                          key: 'priority',
                          render: (priority) => (
                            <Tag color={priorityColors[priority]}>
                              {priorityList.find(p => p.value === priority)?.label || priority}
                            </Tag>
                          )
                        },
                        {
                          title: 'Người thực hiện',
                          dataIndex: 'assignee',
                          key: 'assignee',
                          render: (assignee) => {
                            if (assignee && assignee.name) {
                              return assignee.name;
                            }
                            if (assignee && assignee.id) {
                              const user = users.find(u => u.id === assignee.id);
                              return user ? user.name : 'Chưa phân công';
                            }
                            return 'Chưa phân công';
                          }
                        },
                        {
                          title: 'Thao tác',
                          key: 'actions',
                          render: (_, record) => (
                            <Space>
                              <Button
                                type="link"
                                size="small"
                                onClick={() => handleEdit(record)}
                                icon={<EditOutlined />}
                              >
                                Sửa
                              </Button>
                              <Button
                                type="link"
                                size="small"
                                danger
                                onClick={() => handleDelete(record.id)}
                                icon={<DeleteOutlined />}
                              >
                                Xóa
                              </Button>
                              <Button
                                type="link"
                                size="small"
                                onClick={() => openCommentDrawer(record)}
                                icon={<MessageOutlined />}
                              >
                                Ghi chú
                              </Button>
                            </Space>
                          )
                        }
                      ]}
                    />
                  );
                }
              }}
              columns={[
                {
                  title: 'Dự án',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text, record) => (
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{text}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.description}
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Trạng thái dự án',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => {
                    const statusMap = {
                      'ACTIVE': { label: 'Đang triển khai', color: 'green' },
                      'PLANNING': { label: 'Lập kế hoạch', color: 'blue' },
                      'ON_HOLD': { label: 'Tạm dừng', color: 'orange' },
                      'COMPLETED': { label: 'Hoàn thành', color: 'purple' },
                      'ARCHIVED': { label: 'Lưu trữ', color: 'grey' }
                    };
                    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: 'default' };
                    return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
                  }
                },
                {
                  title: 'Số nhiệm vụ',
                  key: 'taskCount',
                  render: (_, record) => getSortedTasksForProject(record.id).length
                }
              ]}
            />
          </Card>
        ) : (
          <Card>
            <div className="gantt-wrapper">
              {(() => {
                try {
                  // Kiểm tra dữ liệu
                  if (!Array.isArray(tasks) || tasks.length === 0) {
                    return <Empty description="Không có dữ liệu để hiển thị timeline" />;
                  }
                  
                  const ganttTasks = getGanttTasks();
                  
                  if (!ganttTasks || ganttTasks.length === 0) {
                    return <Empty description="Không có nhiệm vụ nào để hiển thị" />;
                  }
                  
                  // Log để debug
                  console.log('Rendering Gantt with tasks:', ganttTasks);
                  
                  // Render Gantt component
                  return (
                    <div className="gantt-container" style={{ 
                      background: isDarkMode ? '#18191c' : '#fff', 
                      borderRadius: 8, 
                      padding: 0,
                      position: 'relative',
                      transform: `scale(${ganttZoom})`,
                      transformOrigin: 'top left',
                      width: `${100 / ganttZoom}%`,
                      minHeight: 400
                    }}>
                      <style>{`
                        .gantt-container {
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        }
                        
                        /* Header styles */
                        .gantt-container .gantt_grid_head_cell {
                          background: ${isDarkMode ? '#1f1f1f' : '#f5f5f5'};
                          color: ${isDarkMode ? '#fff' : '#333'};
                          font-weight: 500;
                          font-size: 13px;
                          border-right: 1px solid ${isDarkMode ? '#333' : '#e0e0e0'};
                          border-bottom: 2px solid ${isDarkMode ? '#333' : '#e0e0e0'};
                        }
                        
                        /* Task list styles */
                        .gantt-container .gantt_cell {
                          border-right: 1px solid ${isDarkMode ? '#333' : '#e0e0e0'};
                          border-bottom: 1px solid ${isDarkMode ? '#2a2a2a' : '#f0f0f0'};
                          background: ${isDarkMode ? '#1a1a1a' : '#fff'};
                          color: ${isDarkMode ? '#fff' : '#333'};
                        }
                        
                        /* Project row */
                        .gantt-container .gantt_row.gantt_project {
                          background: ${isDarkMode ? '#262626' : '#fafafa'};
                          font-weight: 600;
                        }
                        
                        /* Task row */
                        .gantt-container .gantt_row.gantt_task_row {
                          background: ${isDarkMode ? '#1a1a1a' : '#fff'};
                        }
                        
                        .gantt-container .gantt_row:hover {
                          background: ${isDarkMode ? '#333' : '#f5f7fa'};
                        }
                        
                        /* Task bars */
                        .gantt-container .gantt_task_line {
                          border-radius: 3px;
                          border: none;
                        }
                        
                        /* Project bar */
                        .gantt-container .gantt_task_line.gantt_project {
                          background: #1890ff;
                          height: 22px;
                          margin-top: 8px;
                        }
                        
                        /* Task bar */
                        .gantt-container .gantt_task_line:not(.gantt_project) {
                          background: #40a9ff;
                          height: 20px;
                          margin-top: 9px;
                        }
                        
                        /* Progress bar */
                        .gantt-container .gantt_task_progress {
                          background: rgba(0, 0, 0, 0.2);
                          height: 100%;
                          border-radius: 3px;
                        }
                        
                        /* Task content */
                        .gantt-container .gantt_task_content {
                          color: #fff;
                          font-size: 11px;
                          font-weight: 500;
                          padding: 0 8px;
                          display: flex;
                          align-items: center;
                          height: 100%;
                        }
                        
                        /* Grid columns */
                        .gantt-container .gantt_grid_scale .gantt_grid_head_cell {
                          text-align: center;
                        }
                        
                        /* Calendar area */
                        .gantt-container .gantt_task_scale {
                          background: ${isDarkMode ? '#1f1f1f' : '#f5f5f5'};
                          border-bottom: 2px solid ${isDarkMode ? '#333' : '#e0e0e0'};
                        }
                        
                        .gantt-container .gantt_scale_cell {
                          border-right: 1px solid ${isDarkMode ? '#333' : '#e0e0e0'};
                          color: ${isDarkMode ? '#fff' : '#333'};
                          font-size: 12px;
                          font-weight: 500;
                        }
                        
                        /* Grid lines in calendar */
                        .gantt-container .gantt_task_cell {
                          border-right: 1px solid ${isDarkMode ? '#2a2a2a' : '#f0f0f0'};
                          background: ${isDarkMode ? '#1a1a1a' : '#fff'};
                        }
                        
                        /* Weekend columns */
                        .gantt-container .gantt_task_cell.gantt_cell_weekend {
                          background: ${isDarkMode ? '#222' : '#fafafa'};
                        }
                        
                        /* Today marker */
                        .gantt-container .gantt_marker_today {
                          background: #ff7875;
                          width: 2px;
                        }
                        
                        /* Links between tasks */
                        .gantt-container .gantt_task_link .gantt_link_arrow {
                          border-color: #ffa940;
                        }
                        
                        .gantt-container .gantt_task_link .gantt_line_wrapper div {
                          background: #ffa940;
                        }
                        
                        /* Hover effects */
                        .gantt-container .gantt_task_line:hover {
                          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                          transform: translateY(-1px);
                          transition: all 0.2s;
                        }
                        
                        /* Selected task */
                        .gantt-container .gantt_task_line.gantt_selected {
                          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.4);
                        }
                        
                        /* Scrollbar styles */
                        .gantt-container ::-webkit-scrollbar {
                          width: 8px;
                          height: 8px;
                        }
                        
                        .gantt-container ::-webkit-scrollbar-track {
                          background: ${isDarkMode ? '#1a1a1a' : '#f0f0f0'};
                        }
                        
                        .gantt-container ::-webkit-scrollbar-thumb {
                          background: ${isDarkMode ? '#666' : '#bfbfbf'};
                          border-radius: 4px;
                        }
                        
                        .gantt-container ::-webkit-scrollbar-thumb:hover {
                          background: ${isDarkMode ? '#888' : '#8c8c8c'};
                        }
                      `}</style>
                      
                      {/* Header */}
                      <div style={{ display: 'flex', width: '100%', borderBottom: `1px solid ${isDarkMode ? '#333' : '#e8e8e8'}` }}>
                        <div style={{ 
                          width: ganttListCellWidth, 
                          padding: '12px', 
                          background: isDarkMode ? '#1f1f1f' : '#fafafa',
                          fontWeight: 'bold',
                          color: isDarkMode ? '#fff' : '#333'
                        }}>
                          Tên nhiệm vụ
                        </div>
                        <div style={{ 
                          flex: 1, 
                          padding: '12px',
                          background: isDarkMode ? '#1f1f1f' : '#fafafa',
                          fontWeight: 'bold',
                          color: isDarkMode ? '#fff' : '#333'
                        }}>
                          Timeline
                        </div>
                      </div>
                      
                      {/* Gantt Chart Container */}
                      <div style={{ position: 'relative', minHeight: 300 }}>
                        <GanttErrorBoundary>
                          <Gantt
                            tasks={ganttTasks}
                            viewMode={ganttViewMode}
                            listCellWidth={`${ganttListCellWidth}px`}
                            columnWidth={ganttColumnWidth}
                            ganttHeight={500}
                            fontSize="11"
                            fontFamily="Arial, sans-serif"
                            barCornerRadius={3}
                            barFill={60}
                            rowHeight={35}
                            headerHeight={50}
                          />
                        </GanttErrorBoundary>
                      </div>
                    </div>
                  );
                } catch (error) {
                  console.error('Error rendering timeline:', error);
                  return (
                    <Empty 
                      description="Có lỗi xảy ra khi hiển thị timeline" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  );
                }
              })()}
            </div>
          </Card>
        )}
      </div>

      {/* Gantt Settings Modal */}
      <Modal
        title="Cài đặt Gantt Timeline"
        open={ganttSettingsVisible}
        onOk={() => setGanttSettingsVisible(false)}
        onCancel={() => setGanttSettingsVisible(false)}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item label="Bề rộng cột ngày tháng">
            <Slider
              min={15}
              max={40}
              value={ganttColumnWidth}
              onChange={setGanttColumnWidth}
              marks={{
                15: '15px',
                20: '20px',
                25: '25px',
                30: '30px',
                40: '40px'
              }}
            />
          </Form.Item>
          <Form.Item label="Bề rộng cột danh sách">
            <Slider
              min={150}
              max={400}
              value={ganttListCellWidth}
              onChange={setGanttListCellWidth}
              marks={{
                150: '150px',
                200: '200px',
                250: '250px',
                300: '300px',
                400: '400px'
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Task Modal */}
      <Modal
        title={editingTask ? 'Sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'TODO',
            priority: 'MEDIUM',
            category: 'OTHER'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
          <Form.Item
            name="title"
                label="Tên nhiệm vụ"
                rules={[{ required: true, message: 'Vui lòng nhập tên nhiệm vụ!' }]}
          >
                <Input placeholder="Nhập tên nhiệm vụ" />
          </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="projectId"
                label="Dự án"
                rules={[{ required: true, message: 'Vui lòng chọn dự án!' }]}
              >
                <Select placeholder="Chọn dự án">
                  {projects.map(project => (
                    <Option key={project.id} value={project.id}>
                      {project.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assignee"
                label="Người thực hiện"
                rules={[{ required: true, message: 'Vui lòng chọn người thực hiện!' }]}
              >
                <Select placeholder="Chọn người thực hiện">
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Mức độ ưu tiên"
                rules={[{ required: true, message: 'Vui lòng chọn mức độ ưu tiên!' }]}
              >
                <Select placeholder="Chọn mức độ ưu tiên">
                  {priorityList.map(priority => (
                    <Option key={priority.value} value={priority.value}>
                      {priority.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
              >
                <Select placeholder="Chọn trạng thái">
                  {statusList.map(status => (
                    <Option key={status.value} value={status.value}>
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Phân loại thẻ"
                rules={[{ required: true, message: 'Vui lòng chọn phân loại!' }]}
              >
                <Select placeholder="Chọn phân loại">
                  {categoryList.map(category => (
                    <Option key={category.value} value={category.value}>
                      {category.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="startDate" 
                label="Ngày bắt đầu"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  placeholder="Chọn ngày bắt đầu"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="dueDate" 
                label="Hạn hoàn thành"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  placeholder="Chọn hạn hoàn thành"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Nhập mô tả nhiệm vụ..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* History Drawer */}
      <Drawer
        title="Lịch sử công việc"
        placement="right"
        width={400}
        onClose={() => setHistoryDrawerOpen(false)}
        open={historyDrawerOpen}
      >
        <List
          dataSource={historyList}
          renderItem={(item: any) => (
            <List.Item>
              <List.Item.Meta
                title={item.action}
                description={
                  <div>
                    <div>{item.details}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {moment(item.createdAt).format('DD/MM/YYYY HH:mm')}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>

      {/* Comment Drawer */}
      <Drawer
        title={`Ghi chú cho: ${selectedTask?.title || ''}`}
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
                background: item.user?.id === (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id : '') ? (isDarkMode ? '#223355' : '#e6f7ff') : (isDarkMode ? '#232428' : '#fff'),
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
          <Form form={commentForm}>
            <Form.Item name="content" style={{ marginBottom: 8 }}>
              <Input.TextArea
                rows={3}
                placeholder="Nhập ghi chú trao đổi..."
                style={{ 
                  background: isDarkMode ? '#232428' : '#fff', 
                  color: isDarkMode ? '#fff' : '#222', 
                  borderColor: isDarkMode ? '#333' : undefined 
                }}
                onPressEnter={e => { 
                  if (!e.shiftKey) { 
                    e.preventDefault(); 
                    handleAddComment(); 
                  } 
                }}
              />
            </Form.Item>
            <Button
              type="primary"
              onClick={handleAddComment}
              loading={commentLoading}
              style={{ 
                marginTop: 8, 
                background: isDarkMode ? '#223355' : undefined, 
                color: isDarkMode ? '#fff' : undefined, 
                border: isDarkMode ? 'none' : undefined 
              }}
              block
            >
              Gửi ghi chú
            </Button>
          </Form>
        </div>
      </Drawer>
    </div>
  );
};

export default Tasks;
