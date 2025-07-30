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
  Empty
} from 'antd';
import axiosInstance from '../axiosConfig';
import moment from 'moment';
import { useOutletContext } from 'react-router-dom';
import io from 'socket.io-client';
import debounce from 'lodash.debounce';
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
  MessageOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { ViewMode, Gantt, Task as GanttTask } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

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

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [form] = Form.useForm();
  const outletContext = useOutletContext<{ role?: string }>() || {};
  const role = outletContext.role || '';
  const [filter, setFilter] = useState<{
    search: string;
    status: string;
    priority: string;
    assigneeId: string;
    projectId: string;
    dueDate: any;
  }>({ 
    search: '', 
    status: '', 
    priority: '',
    assigneeId: '', 
    projectId: '',
    dueDate: null 
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [kanbanTasks, setKanbanTasks] = useState<{ [key: string]: any[] }>({});
  const [historyDrawer, setHistoryDrawer] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyTaskId, setHistoryTaskId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'gantt'>('table');
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [commentTask, setCommentTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentValue, setCommentValue] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const theme = useSelector((state: any) => state.ui.theme);
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const fetchTasks = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      
      if (filter.search) params.append('search', filter.search);
      if (filter.status) params.append('status', filter.status);
      if (filter.priority) params.append('priority', filter.priority);
      if (filter.assigneeId) params.append('assigneeId', filter.assigneeId);
      if (filter.projectId) params.append('projectId', filter.projectId);
      if (filter.dueDate && typeof filter.dueDate.format === 'function') {
        params.append('dueDate', filter.dueDate.format('YYYY-MM-DD'));
      }

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
      // Debug: Check authentication
      const token = localStorage.getItem('token');
      console.log('🔍 Debug - Token exists:', !!token);
      console.log('🔍 Debug - Token:', token ? token.substring(0, 20) + '...' : 'No token');
      
      // Thử lấy tất cả users (cho admin)
      const res = await axiosInstance.get('/users');
      const usersData = res.data.users || res.data;
      setUsers(Array.isArray(usersData) ? usersData : []);
      console.log('✅ Users fetched successfully:', usersData.length);
    } catch (e) {
      console.error('❌ Lỗi fetchUsers (admin):', e);
      // Nếu không phải admin, thử lấy users từ project đầu tiên
      try {
        if (projects.length > 0) {
          console.log('🔄 Trying assignable users for project:', projects[0].id);
          const res = await axiosInstance.get(`/users/assignable?projectId=${projects[0].id}`);
          setUsers(Array.isArray(res.data) ? res.data : []);
          console.log('✅ Assignable users fetched:', res.data.length);
        } else {
          console.log('⚠️ No projects available for assignable users');
          setUsers([]);
        }
      } catch (e2) {
        console.error('❌ Lỗi fetchUsers (assignable):', e2);
        message.error('Không thể tải danh sách người dùng!');
        setUsers([]);
      }
    }
  };

  const fetchProjects = async () => {
    try {
      // Debug: Check authentication
      const token = localStorage.getItem('token');
      console.log('🔍 Debug - Projects - Token exists:', !!token);
      
      const res = await axiosInstance.get('/projects');
      // Backend trả về { projects, pagination }
      const projectsData = res.data.projects || res.data;
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      console.log('✅ Projects fetched successfully:', projectsData.length);
    } catch (e) {
      console.error('❌ Lỗi fetchProjects:', e);
      setProjects([]);
    }
  };

  // Fetch comments for a task
  const fetchComments = async (taskId: string) => {
    setCommentLoading(true);
    try {
      const res = await axiosInstance.get(`/tasks/${taskId}`);
      setComments(res.data.comments || []);
    } catch (e) {
      setComments([]);
    }
    setCommentLoading(false);
  };

  // Open comment drawer
  const openCommentDrawer = (task: any) => {
    if (!task || !task.id) {
      message.warning('Vui lòng chọn một nhiệm vụ cụ thể để trao đổi ghi chú!');
      return;
    }
    setCommentTask(task);
    setCommentDrawerOpen(true);
    fetchComments(task.id);
    setTimeout(() => {
      const input = document.getElementById('comment-input');
      if (input) (input as HTMLTextAreaElement).focus();
    }, 300);
  };

  // Add comment
  const handleAddComment = async () => {
    if (!commentValue.trim() || !commentTask || !commentTask.id) return;
    setCommentLoading(true);
    try {
      await axiosInstance.post(`/tasks/${commentTask.id}/comments`, { content: commentValue.trim() });
      setCommentValue('');
      fetchComments(commentTask.id);
      message.success('Đã thêm ghi chú!');
    } catch (e) {
      message.error('Không thể thêm ghi chú!');
    }
    setCommentLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    
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

  useEffect(() => {
    if (projects.length > 0) {
      fetchUsers();
    }
  }, [projects]);

  useEffect(() => {
    fetchTasks(pagination.current, pagination.pageSize);
  }, [filter]);

  const handleEdit = (record: any) => {
    setEditingTask(record);
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? moment(record.startDate) : null,
      dueDate: record.dueDate ? moment(record.dueDate) : null,
      projectId: record.projectId
    });
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
    setEditingTask(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('Submit task values:', values);
      
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
        assigneeId: values.assigneeId || undefined,
        projectId: values.projectId
      };

      if (editingTask) {
        await axiosInstance.put(`/tasks/${editingTask.id}`, submitData);
        message.success('Đã cập nhật công việc');
      } else {
        await axiosInstance.post('/tasks', submitData);
        message.success('Đã thêm công việc');
      }
      setModalOpen(false);
      fetchTasks();
    } catch (e: any) {
      console.error('Error in handleOk:', e);
      message.error(e?.response?.data?.error || e?.message || JSON.stringify(e));
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
      setHistoryList(res.data.history || res.data);
      setHistoryTaskId(id);
      setHistoryDrawer(true);
    } catch (e) {
      message.error('Không thể tải lịch sử');
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (pagination: any) => {
    fetchTasks(pagination.current, pagination.pageSize);
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

  // Sắp xếp dự án theo trạng thái và mức độ ưu tiên (như bên thẻ dự án)
  const getSortedProjects = () => {
    const statusOrder = {
      'ACTIVE': 1,      // Đang thực hiện
      'PLANNING': 2,    // Đang lên kế hoạch
      'ON_HOLD': 3,     // Đang tạm dừng
      'COMPLETED': 4,   // Hoàn thành
      'ARCHIVED': 5     // Lưu trữ
    };

    return projects.sort((a, b) => {
      const statusA = statusOrder[a.status as keyof typeof statusOrder] || 999;
      const statusB = statusOrder[b.status as keyof typeof statusOrder] || 999;
      
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      
      // Nếu cùng trạng thái, sắp xếp theo mức độ ưu tiên (chỉ áp dụng cho ACTIVE)
      if (a.status === 'ACTIVE' && b.status === 'ACTIVE') {
        const priorityOrder = {
          'HIGH': 1,        // Cao
          'MEDIUM': 2,      // Trung bình
          'LOW': 3          // Thấp
        };
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 999;
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 999;
        return priorityA - priorityB;
      }
      
      // Các trạng thái khác sắp xếp theo tên dự án
      return a.name.localeCompare(b.name);
    });
  };

  // Sắp xếp nhiệm vụ trong 1 dự án theo ưu tiên từ cao tới thấp
  const getSortedTasksForProject = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const priorityOrder = {
      'URGENT': 1,
      'HIGH': 2,
      'MEDIUM': 3,
      'LOW': 4
    };

    return projectTasks.sort((a, b) => {
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 999;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 999;
      return priorityA - priorityB;
    });
  };

  // Chuyển đổi dữ liệu tasks sang định dạng Gantt
  const getGanttTasks = (): GanttTask[] => {
    return tasks.map((task) => ({
      id: task.id,
      name: task.title,
      start: task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : new Date()),
      end: task.dueDate ? new Date(task.dueDate) : (task.startDate ? new Date(task.startDate) : new Date()),
      type: 'task',
      progress: task.status === 'COMPLETED' ? 100 : 0,
      isDisabled: false,
      styles: { progressColor: '#1890ff', progressSelectedColor: '#52c41a' },
      project: task.project?.name || '',
    }));
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
            title="Xóa công việc này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      )
    },
    {
      title: 'Ghi chú',
      key: 'comments',
      render: (_: any, record: any) => (
        record && record.id ? (
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
        ) : (
          <Tooltip title="Chỉ xem ghi chú cho từng nhiệm vụ cụ thể">
            <Button shape="circle" icon={<MessageOutlined />} size="small" disabled />
          </Tooltip>
        )
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
          record && record.id ? (
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
          ) : (
            <Tooltip title="Chỉ xem ghi chú cho từng nhiệm vụ cụ thể">
              <Button shape="circle" icon={<MessageOutlined />} size="small" disabled />
            </Tooltip>
          )
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
        <Card style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Input
                placeholder="Tìm kiếm công việc..."
                prefix={<SearchOutlined />}
                value={filter.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Trạng thái"
                value={filter.status}
                onChange={(value) => handleFilterChange('status', value)}
                allowClear
                style={{ width: '100%' }}
              >
                {statusList.map(status => (
                  <Option key={status.value} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Độ ưu tiên"
                value={filter.priority}
                onChange={(value) => handleFilterChange('priority', value)}
                allowClear
                style={{ width: '100%' }}
              >
                {priorityList.map(priority => (
                  <Option key={priority.value} value={priority.value}>
                    {priority.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Người thực hiện"
                value={filter.assigneeId}
                onChange={(value) => handleFilterChange('assigneeId', value)}
                allowClear
                style={{ width: '100%' }}
              >
                {users.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Dự án"
                value={filter.projectId}
                onChange={(value) => handleFilterChange('projectId', value)}
                allowClear
                style={{ width: '100%' }}
              >
                {projects.map(project => (
                  <Option key={project.id} value={project.id}>
                    {project.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={2}>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => {
                  setFilter({ search: '', status: '', priority: '', assigneeId: '', projectId: '', dueDate: null });
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
              >
                Reset
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Task Table */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Button type={viewMode === 'table' ? 'primary' : 'default'} onClick={() => setViewMode('table')}>Bảng</Button>
            <Button type={viewMode === 'gantt' ? 'primary' : 'default'} onClick={() => setViewMode('gantt')} style={{ marginLeft: 8 }}>Gantt Timeline</Button>
          </div>
          <div>
            <Button onClick={handleExportTable} style={{ marginRight: 8 }}>Xuất PDF Bảng</Button>
            <Button onClick={handleExportGantt}>Xuất PDF Gantt</Button>
          </div>
        </div>

        {viewMode === 'table' ? (
        <Table
          columns={parentColumns}
          dataSource={groupedTasks}
          rowKey={record => (record && typeof record === 'object' && 'key' in record ? (record as any).key : undefined)}
          expandable={{
            expandedRowRender: (record) => (
              <Table
                columns={childColumns}
                dataSource={record.tasks}
                rowKey={task => (task && typeof task === 'object' && 'id' in task ? (task as any).id : undefined)}
                pagination={false}
                showHeader={true}
                bordered={false}
              />
            ),
            rowExpandable: record => record.tasks.length > 0,
          }}
          pagination={false}
          showHeader={false}
          bordered
          style={{ marginTop: 24 }}
          locale={{ emptyText: 'Không có công việc nào' }}
        />
        ) : (
          <div className="gantt-container" style={{ background: isDarkMode ? '#232428' : '#fff', padding: 16, borderRadius: 8, marginTop: 24 }}>
            <Gantt
              tasks={getGanttTasks()}
              viewMode={ViewMode.Day}
              locale="vi"
              TooltipContent={({ task }) => (
                <div>
                  <b>{task.name}</b><br />
                  Ngày bắt đầu: {moment(task.start).format('DD/MM/YYYY')}<br />
                  Hạn: {moment(task.end).format('DD/MM/YYYY')}
                </div>
              )}
            />
          </div>
        )}
      </div>

      {/* Task Modal */}
      <Modal
        title={editingTask ? 'Sửa công việc' : 'Thêm công việc'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Tên công việc"
            rules={[{ required: true, message: 'Vui lòng nhập tên công việc!' }]}
          >
            <Input placeholder="Nhập tên công việc" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Nhập mô tả công việc" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="projectId"
                label="Dự án"
                rules={[{ required: true, message: 'Vui lòng chọn dự án!' }]}
              >
                <Select placeholder="Chọn dự án">
                  {getSortedProjects().map(project => (
                    <Option key={project.id} value={project.id}>
                      {project.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assigneeId" label="Người thực hiện">
                <Select placeholder="Chọn người thực hiện" allowClear>
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name}
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
              <Form.Item name="priority" label="Độ ưu tiên">
                <Select placeholder="Chọn độ ưu tiên" defaultValue="MEDIUM">
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
                name="startDate" 
                label="Ngày bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu!' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày bắt đầu"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="dueDate" 
                label="Hạn hoàn thành"
                rules={[{ required: true, message: 'Vui lòng chọn hạn hoàn thành!' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  placeholder="Chọn hạn hoàn thành"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* History Drawer */}
      <Drawer
        title="Lịch sử công việc"
        placement="right"
        width={400}
        onClose={() => setHistoryDrawer(false)}
        open={historyDrawer}
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
        title={`Ghi chú cho: ${commentTask?.title || ''}`}
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
          <Input.TextArea
            id="comment-input"
            rows={3}
            value={commentValue}
            onChange={e => setCommentValue(e.target.value)}
            placeholder="Nhập ghi chú trao đổi..."
            style={{ background: isDarkMode ? '#232428' : '#fff', color: isDarkMode ? '#fff' : '#222', borderColor: isDarkMode ? '#333' : undefined }}
            onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
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

export default Tasks; 