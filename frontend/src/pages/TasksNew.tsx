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
  DatePicker
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  project: string;
  startDate: string;
  dueDate: string;
  progress: number;
  estimatedHours: number;
  actualHours: number;
  tags: string[];
}

const TasksNew: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');

  // Mock data for demonstration
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Thiết kế mặt bằng tổng thể',
      description: 'Thiết kế mặt bằng tổng thể cho dự án cầu vượt',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignee: 'Trần Thị B',
      project: 'Dự án Cầu Vượt',
      startDate: '2024-02-10',
      dueDate: '2024-03-15',
      progress: 75,
      estimatedHours: 40,
      actualHours: 30,
      tags: ['Thiết kế', 'Kiến trúc']
    },
    {
      id: '2',
      title: 'Khảo sát địa chất',
      description: 'Tiến hành khảo sát địa chất tại khu vực xây dựng',
      status: 'COMPLETED',
      priority: 'HIGH',
      assignee: 'Lê Văn C',
      project: 'Dự án Cầu Vượt',
      startDate: '2024-01-15',
      dueDate: '2024-02-28',
      progress: 100,
      estimatedHours: 24,
      actualHours: 22,
      tags: ['Khảo sát', 'Địa chất']
    },
    {
      id: '3',
      title: 'Lập báo cáo tác động môi trường',
      description: 'Lập báo cáo đánh giá tác động môi trường',
      status: 'PENDING',
      priority: 'MEDIUM',
      assignee: 'Nguyễn Văn A',
      project: 'Dự án Hạ Tầng ABC',
      startDate: '2024-03-01',
      dueDate: '2024-04-10',
      progress: 0,
      estimatedHours: 16,
      actualHours: 0,
      tags: ['Môi trường', 'Báo cáo']
    },
    {
      id: '4',
      title: 'Thiết kế kết cấu',
      description: 'Thiết kế kết cấu cho các hạng mục chính',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignee: 'Phạm Thị D',
      project: 'Dự án Tòa Nhà Văn Phòng',
      startDate: '2024-02-15',
      dueDate: '2024-03-30',
      progress: 60,
      estimatedHours: 80,
      actualHours: 48,
      tags: ['Kết cấu', 'Thiết kế']
    },
    {
      id: '5',
      title: 'Lập dự toán chi tiết',
      description: 'Lập dự toán chi tiết cho toàn bộ dự án',
      status: 'ON_HOLD',
      priority: 'MEDIUM',
      assignee: 'Hoàng Văn E',
      project: 'Dự án Công Viên',
      startDate: '2024-03-15',
      dueDate: '2024-04-20',
      progress: 30,
      estimatedHours: 32,
      actualHours: 10,
      tags: ['Dự toán', 'Tài chính']
    }
  ];

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/tasks');
      setTasks(response.data || mockTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks(mockTasks);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const getStatusCount = (status: string) => {
    if (status === 'all') return tasks.length;
    return tasks.filter(task => task.status === status).length;
  };

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchText.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
      const matchesProject = selectedProject === 'all' || task.project === selectedProject;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string; icon: React.ReactNode } } = {
      'PENDING': { label: 'Chờ thực hiện', color: 'orange', icon: <ClockCircleOutlined /> },
      'IN_PROGRESS': { label: 'Đang thực hiện', color: 'blue', icon: <ExclamationCircleOutlined /> },
      'COMPLETED': { label: 'Hoàn thành', color: 'green', icon: <CheckCircleOutlined /> },
      'ON_HOLD': { label: 'Tạm dừng', color: 'red', icon: <CloseCircleOutlined /> },
      'CANCELLED': { label: 'Đã hủy', color: 'grey', icon: <CloseCircleOutlined /> }
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
    setEditingTask(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: Task) => {
    setEditingTask(record);
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? moment(record.startDate) : null,
      dueDate: record.dueDate ? moment(record.dueDate) : null,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/tasks/${id}`);
      message.success('Đã xóa nhiệm vụ!');
      fetchTasks();
    } catch (error) {
      message.error('Lỗi khi xóa nhiệm vụ!');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Xử lý startDate và dueDate
      const submitData = {
        ...values,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
      };
      
      if (editingTask) {
        await axiosInstance.put(`/api/tasks/${editingTask.id}`, submitData);
        message.success('Đã cập nhật nhiệm vụ!');
      } else {
        await axiosInstance.post('/api/tasks', submitData);
        message.success('Đã thêm nhiệm vụ!');
      }
      
      setModalOpen(false);
      fetchTasks();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Lỗi khi lưu nhiệm vụ!');
    }
  };

  const columns = [
    {
      title: 'NHIỆM VỤ',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Task) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ backgroundColor: '#1890ff' }}>
            <CheckCircleOutlined />
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{record.description}</div>
                         <div style={{ marginTop: 4 }}>
               {record.tags.map(tag => (
                 <Tag key={tag} style={{ marginRight: 4 }}>
                   {tag}
                 </Tag>
               ))}
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
      title: 'TIẾN ĐỘ',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <div>
          <Progress percent={progress} size="small" />
          <Text style={{ fontSize: 12 }}>{progress}%</Text>
        </div>
      ),
    },
    {
      title: 'NGƯỜI THỰC HIỆN',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (assignee: string, record: Task) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={24} style={{ backgroundColor: '#52c41a' }}>
              <UserOutlined />
            </Avatar>
            <Text>{assignee}</Text>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {record.project}
          </div>
        </div>
      ),
    },
    {
      title: 'NGÀY BẮT ĐẦU',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (startDate: string) => (
        <div>
          <Text>{moment(startDate).format('DD/MM/YYYY')}</Text>
          <div style={{ fontSize: 12, color: '#666' }}>
            {moment(startDate).fromNow()}
          </div>
        </div>
      ),
    },
    {
      title: 'HẠN HOÀN THÀNH',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (dueDate: string) => (
        <div>
          <Text>{moment(dueDate).format('DD/MM/YYYY')}</Text>
          <div style={{ fontSize: 12, color: '#666' }}>
            {moment(dueDate).fromNow()}
          </div>
        </div>
      ),
    },
    {
      title: 'THỜI GIAN',
      key: 'time',
      render: (record: Task) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 12 }}>Ước tính: {record.estimatedHours}h</Text>
          </div>
          <div>
            <Text style={{ fontSize: 12 }}>Thực tế: {record.actualHours}h</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'THAO TÁC',
      key: 'actions',
      render: (record: Task) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Báo cáo tiến độ">
            <Button type="text" size="small" icon={<DownloadOutlined />} />
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
          <Title level={2} style={{ margin: 0 }}>Quản Lý Nhiệm Vụ</Title>
          <Text type="secondary">Theo dõi và quản lý các nhiệm vụ dự án</Text>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />}>
            Xuất Báo Cáo
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm Nhiệm Vụ
          </Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng Nhiệm Vụ"
              value={tasks.length}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang Thực Hiện"
              value={getStatusCount('IN_PROGRESS')}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Chờ Thực Hiện"
              value={getStatusCount('PENDING')}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Hoàn Thành"
              value={getStatusCount('COMPLETED')}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter and Search */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input
              placeholder="Tìm kiếm nhiệm vụ..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={12}>
            <Space>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 150 }}
                placeholder="Tất cả trạng thái"
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="PENDING">Chờ thực hiện</Option>
                <Option value="IN_PROGRESS">Đang thực hiện</Option>
                <Option value="COMPLETED">Hoàn thành</Option>
                <Option value="ON_HOLD">Tạm dừng</Option>
                <Option value="CANCELLED">Đã hủy</Option>
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

              <Select
                value={selectedProject}
                onChange={setSelectedProject}
                style={{ width: 150 }}
                placeholder="Tất cả dự án"
              >
                <Option value="all">Tất cả dự án</Option>
                <Option value="Dự án Cầu Vượt">Dự án Cầu Vượt</Option>
                <Option value="Dự án Hạ Tầng ABC">Dự án Hạ Tầng ABC</Option>
                <Option value="Dự án Tòa Nhà Văn Phòng">Dự án Tòa Nhà Văn Phòng</Option>
                <Option value="Dự án Công Viên">Dự án Công Viên</Option>
              </Select>
            </Space>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <Button icon={<ClearOutlined />} onClick={() => {
              setSearchText('');
              setSelectedStatus('all');
              setSelectedPriority('all');
              setSelectedProject('all');
            }}>
              Xóa bộ lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Tasks Table */}
      <Card title={`Danh sách nhiệm vụ (${getFilteredTasks().length})`}>
        <Table
          columns={columns}
          dataSource={getFilteredTasks()}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} nhiệm vụ`,
          }}
        />
      </Card>

      {/* Add/Edit Task Modal */}
      <Modal
        title={editingTask ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}
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
                name="title"
                label="Tên nhiệm vụ"
                rules={[{ required: true, message: 'Vui lòng nhập tên nhiệm vụ!' }]}
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
                  <Option value="PENDING">Chờ thực hiện</Option>
                  <Option value="IN_PROGRESS">Đang thực hiện</Option>
                  <Option value="COMPLETED">Hoàn thành</Option>
                  <Option value="ON_HOLD">Tạm dừng</Option>
                  <Option value="CANCELLED">Đã hủy</Option>
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
                name="assignee"
                label="Người thực hiện"
                rules={[{ required: true, message: 'Vui lòng chọn người thực hiện!' }]}
              >
                <Select placeholder="Chọn người thực hiện">
                  <Option value="Trần Thị B">Trần Thị B</Option>
                  <Option value="Lê Văn C">Lê Văn C</Option>
                  <Option value="Nguyễn Văn A">Nguyễn Văn A</Option>
                  <Option value="Phạm Thị D">Phạm Thị D</Option>
                  <Option value="Hoàng Văn E">Hoàng Văn E</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="project"
                label="Dự án"
                rules={[{ required: true, message: 'Vui lòng chọn dự án!' }]}
              >
                <Select placeholder="Chọn dự án">
                  <Option value="Dự án Cầu Vượt">Dự án Cầu Vượt</Option>
                  <Option value="Dự án Hạ Tầng ABC">Dự án Hạ Tầng ABC</Option>
                  <Option value="Dự án Tòa Nhà Văn Phòng">Dự án Tòa Nhà Văn Phòng</Option>
                  <Option value="Dự án Công Viên">Dự án Công Viên</Option>
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
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="Hạn hoàn thành"
                rules={[{ required: true, message: 'Vui lòng chọn hạn hoàn thành!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
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
                name="estimatedHours"
                label="Thời gian ước tính (giờ)"
                rules={[{ required: true, message: 'Vui lòng nhập thời gian ước tính!' }]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tags"
                label="Tags"
              >
                <Select mode="tags" placeholder="Thêm tags">
                  <Option value="Thiết kế">Thiết kế</Option>
                  <Option value="Khảo sát">Khảo sát</Option>
                  <Option value="Kết cấu">Kết cấu</Option>
                  <Option value="Môi trường">Môi trường</Option>
                  <Option value="Dự toán">Dự toán</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default TasksNew; 