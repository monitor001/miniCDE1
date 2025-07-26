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
  ExclamationCircleOutlined
} from '@ant-design/icons';

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
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

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
      const res = await axiosInstance.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Lỗi fetchUsers:', e);
      message.error('Không thể tải danh sách người dùng!');
      setUsers([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axiosInstance.get('/projects');
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Lỗi fetchProjects:', e);
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchProjects();
    
    // Cấu hình Socket.IO với URL chính xác
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
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
    fetchTasks(pagination.current, pagination.pageSize);
  }, [filter]);

  const handleEdit = (record: any) => {
    setEditingTask(record);
    form.setFieldsValue({
      ...record,
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
        ...values,
        dueDate: values.dueDate ? values.dueDate.format() : undefined,
        assigneeId: values.assigneeId || undefined,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return <ClockCircleOutlined />;
      case 'IN_PROGRESS': return <ExclamationCircleOutlined />;
      case 'REVIEW': return <ExclamationCircleOutlined />;
      case 'COMPLETED': return <CheckCircleOutlined />;
      default: return <ClockCircleOutlined />;
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
      title: 'Dự án',
      dataIndex: ['project', 'name'],
      key: 'project',
      render: (text: string) => <Tag color="blue">{text}</Tag>
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
    }
  ];

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    review: tasks.filter(t => t.status === 'REVIEW').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    overdue: tasks.filter(t => t.dueDate && moment(t.dueDate).isBefore(moment(), 'day')).length
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
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} công việc`
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <Empty
                description="Không có công việc nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
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
                  {projects.map(project => (
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

          <Form.Item name="dueDate" label="Hạn hoàn thành">
            <DatePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY"
              placeholder="Chọn hạn hoàn thành"
            />
          </Form.Item>
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
    </div>
  );
};

export default Tasks; 