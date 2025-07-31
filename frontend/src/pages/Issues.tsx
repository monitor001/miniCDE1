import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  Popconfirm, 
  message, 
  Tooltip, 
  Card,
  Row,
  Col,
  Statistic,
  Badge,
  Avatar,
  Typography,
  Divider
} from 'antd';
import axiosInstance from '../axiosConfig';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined,
  UserOutlined,
  CalendarOutlined,
  MessageOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ViewMode, Gantt, Task as GanttTask } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const { Option } = Select;
const { Text, Title } = Typography;

const statusColors: any = {
  'NEW': 'blue',
  'IN_PROGRESS': 'orange',
  'RESOLVED': 'green',
  'CLOSED': 'default',
  'OVERDUE': 'red'
};

const priorityColors: any = {
  'LOW': 'blue',
  'MEDIUM': 'orange',
  'HIGH': 'red'
};

const statusList = [
  { value: 'NEW', label: 'Mới' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã xử lý' },
  { value: 'CLOSED', label: 'Đã đóng' },
  { value: 'OVERDUE', label: 'Quá hạn' }
];

const priorityList = [
  { value: 'LOW', label: 'Thấp' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HIGH', label: 'Cao' }
];

const typeList = [
  { value: 'ISSUE', label: 'Vấn đề' },
  { value: 'RFI', label: 'RFI' }
];

const Issues = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [form] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filter, setFilter] = useState<{
    search: string;
    status: string;
    priority: string;
    type: string;
    assigneeId: string;
    projectId: string;
  }>({ 
    search: '', 
    status: '', 
    priority: '', 
    type: '', 
    assigneeId: '', 
    projectId: '' 
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [viewMode, setViewMode] = useState<'table' | 'gantt'>('table');
  const user = useSelector((state:any) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    fetchIssues();
    fetchUsers();
    fetchProjects();
  }, [pagination.current, pagination.pageSize, filter]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filter
      };
      const res = await axiosInstance.get('/issues', { params });
      setIssues(res.data.issues || res.data);
      setPagination(p => ({ ...p, total: res.data.total || res.data.length }));
    } catch (e) {
      message.error('Không thể tải danh sách vấn đề!');
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/users');
      setUsers(res.data.users || res.data);
    } catch {}
  };

  const fetchProjects = async () => {
    try {
      const res = await axiosInstance.get('/projects');
      setProjects(res.data.projects || res.data);
    } catch {}
  };

  const handleAdd = () => {
    setEditingIssue(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record:any) => {
    setEditingIssue(record);
    form.setFieldsValue({
      ...record,
      projectId: record.project?.id,
      assigneeId: record.assignee?.id
    });
    setModalOpen(true);
  };

  const handleDelete = async (id:string) => {
    try {
      await axiosInstance.delete(`/issues/${id}`);
      message.success('Đã xoá vấn đề');
      fetchIssues();
    } catch {
      message.error('Không thể xoá vấn đề!');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingIssue) {
        await axiosInstance.put(`/issues/${editingIssue.id}`, values);
        message.success('Đã cập nhật vấn đề');
      } else {
        await axiosInstance.post('/issues', values);
        message.success('Đã tạo vấn đề mới');
      }
      setModalOpen(false);
      fetchIssues();
    } catch (e) {
      message.error('Có lỗi xảy ra!');
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (pagination: any) => {
    setPagination(prev => ({ ...prev, current: pagination.current, pageSize: pagination.pageSize }));
  };

  // Sắp xếp issues theo trạng thái (hoàn thành ở cuối)
  const sortIssuesByStatus = (issues: any[]) => {
    const statusOrder = ['NEW', 'IN_PROGRESS', 'OVERDUE', 'RESOLVED', 'CLOSED'];
    return issues.sort((a, b) => {
      const aIndex = statusOrder.indexOf(a.status);
      const bIndex = statusOrder.indexOf(b.status);
      return aIndex - bIndex;
    });
  };

  // Nhóm issues theo projectId
  const groupedIssues = projects.map(project => ({
    key: project.id,
    project,
    issues: sortIssuesByStatus(issues.filter(i => i.projectId === project.id)),
  })).filter(g => g.issues.length > 0);

  // Columns cho parent table (projects)
  const parentColumns = [
    {
      title: 'Dự án',
      dataIndex: 'project',
      key: 'project',
      render: (project: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
            {project.name?.[0] || 'P'}
          </Avatar>
          <div>
            <Text strong>{project.name}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {project.issues?.length || 0} vấn đề
              </Text>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Columns cho child table (issues)
  const childColumns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <Tag color="blue">{code}</Tag>
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: any) => (
        <div>
          <div style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => navigate(`/issues/${record.id}`)}>
            {title}
          </div>
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
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'ISSUE' ? 'purple' : 'cyan'}>
          {typeList.find(t => t.value === type)?.label || type}
        </Tag>
      )
    },
    {
      title: 'Người được giao',
      dataIndex: ['assignee', 'name'],
      key: 'assignee',
      width: 150,
      render: (text: string, record: any) => (
        text ? (
          <Space>
            <Avatar size="small" style={{ backgroundColor: stringToColor(text) }}>
              {text[0]}
            </Avatar>
            <span>{text}</span>
          </Space>
        ) : (
          <Text type="secondary">Chưa gán</Text>
        )
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
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
      width: 120,
      render: (priority: string) => (
        <Tag color={priorityColors[priority]}>
          {priorityList.find(p => p.value === priority)?.label || priority}
        </Tag>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <span>{dayjs(date).format('DD/MM/YYYY')}</span>
        </Space>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/issues/${record.id}`)}
          >
            Chi tiết
          </Button>
          <Button size="small" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa vấn đề này?"
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
      title: 'Bình luận',
      key: 'comments',
      width: 100,
      render: (_: any, record: any) => (
        record && record.id ? (
          <Tooltip title="Xem bình luận">
            <Badge count={record._count?.comments || 0} size="small">
              <Button
                shape="circle"
                icon={<MessageOutlined />}
                onClick={() => navigate(`/issues/${record.id}`)}
                size="small"
              />
            </Badge>
          </Tooltip>
        ) : (
          <Button shape="circle" icon={<MessageOutlined />} size="small" disabled />
        )
      )
    }
  ];

  const issueStats = {
    total: issues.length,
    new: issues.filter(i => i.status === 'NEW').length,
    inProgress: issues.filter(i => i.status === 'IN_PROGRESS').length,
    resolved: issues.filter(i => i.status === 'RESOLVED').length,
    closed: issues.filter(i => i.status === 'CLOSED').length,
    overdue: issues.filter(i => i.status === 'OVERDUE').length
  };

  function stringToColor(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  }

  // Chuyển đổi dữ liệu issues sang định dạng Gantt
  const getGanttIssues = (): GanttTask[] => {
    return issues.map((issue) => ({
      id: issue.id,
      name: issue.title,
      start: issue.createdAt ? new Date(issue.createdAt) : new Date(),
      end: issue.dueDate ? new Date(issue.dueDate) : new Date(),
      type: 'task',
      progress: issue.status === 'RESOLVED' || issue.status === 'CLOSED' ? 100 : 0,
      isDisabled: false,
      styles: { progressColor: '#faad14', progressSelectedColor: '#52c41a' },
      project: issue.project?.name || '',
    }));
  };
  // Xuất PDF cho bảng
  const handleExportTable = () => {
    const doc = new jsPDF();
    const tableData = issues.map((issue, idx) => [
      idx + 1,
      issue.title,
      issue.project?.name || '',
      issue.assignee?.name || '',
      issue.status,
      issue.priority,
      issue.createdAt ? dayjs(issue.createdAt).format('DD/MM/YYYY') : '',
      issue.dueDate ? dayjs(issue.dueDate).format('DD/MM/YYYY') : ''
    ]);
    autoTable(doc, {
      head: [['#', 'Tiêu đề', 'Dự án', 'Người được giao', 'Trạng thái', 'Ưu tiên', 'Ngày tạo', 'Hạn xử lý']],
      body: tableData,
    });
    doc.save('issues-report.pdf');
  };
  // Xuất hình ảnh cho Gantt
  const handleExportGantt = async () => {
    const ganttEl = document.querySelector('.gantt-issues-container');
    if (ganttEl) {
      const canvas = await html2canvas(ganttEl as HTMLElement);
      const link = document.createElement('a');
      link.download = 'issues-gantt.png';
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
            <Title level={3} style={{ margin: 0 }}>Quản lý vấn đề</Title>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm vấn đề
            </Button>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={4}>
            <Card>
              <Statistic title="Tổng cộng" value={issueStats.total} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Mới" 
                value={issueStats.new} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Đang xử lý" 
                value={issueStats.inProgress} 
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Đã xử lý" 
                value={issueStats.resolved} 
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Đã đóng" 
                value={issueStats.closed} 
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Quá hạn" 
                value={issueStats.overdue} 
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filter Card */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={16} align="middle">
            <Col span={4}>
              <Input
                placeholder="Tìm kiếm vấn đề..."
                prefix={<SearchOutlined />}
                value={filter.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                allowClear
              />
            </Col>
            <Col span={3}>
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
            <Col span={3}>
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
            <Col span={3}>
              <Select
                placeholder="Loại"
                value={filter.type}
                onChange={(value) => handleFilterChange('type', value)}
                allowClear
                style={{ width: '100%' }}
              >
                {typeList.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={3}>
              <Select
                placeholder="Người được giao"
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
            <Col span={3}>
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
                  setFilter({ search: '', status: '', priority: '', type: '', assigneeId: '', projectId: '' });
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
              >
                Reset
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Issue Table */}
        <Table
          columns={parentColumns}
          dataSource={groupedIssues}
          rowKey={record => (record && typeof record === 'object' && 'key' in record ? (record as any).key : undefined)}
          expandable={{
            expandedRowRender: (record) => (
              <Table
                columns={childColumns}
                dataSource={record.issues}
                rowKey={issue => (issue && typeof issue === 'object' && 'id' in issue ? (issue as any).id : undefined)}
                pagination={false}
                showHeader={true}
                bordered={false}
              />
            ),
            rowExpandable: record => record.issues.length > 0,
          }}
          pagination={false}
          showHeader={false}
          bordered
          style={{ marginTop: 24 }}
          locale={{ emptyText: 'Không có vấn đề nào' }}
        />
      </div>

      {/* Issue Modal */}
      <Modal
        title={editingIssue ? 'Sửa vấn đề' : 'Thêm vấn đề'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Nhập tiêu đề vấn đề" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Nhập mô tả vấn đề" />
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
              <Form.Item name="type" label="Loại" rules={[{ required: true, message: 'Vui lòng chọn loại!' }]}>
                <Select placeholder="Chọn loại">
                  {typeList.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}>
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
              <Form.Item name="priority" label="Độ ưu tiên" rules={[{ required: true, message: 'Vui lòng chọn độ ưu tiên!' }]}>
                <Select placeholder="Chọn độ ưu tiên">
                  {priorityList.map(priority => (
                    <Option key={priority.value} value={priority.value}>
                      {priority.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="assigneeId" label="Người được giao">
            <Select placeholder="Chọn người được giao" allowClear>
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Issues; 