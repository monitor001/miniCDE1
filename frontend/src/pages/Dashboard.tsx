import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Progress,
  List,
  Avatar,
  Badge,
  Calendar,
  Tooltip
} from 'antd';
import { 
  UserOutlined, 
  ProjectOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import moment from 'moment';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch tasks for current user
      const tasksRes = await axiosInstance.get('/tasks?limit=10');
      const allTasks = tasksRes.data.tasks || tasksRes.data;
      
      // Get current user's tasks
      const currentUserTasks = allTasks.filter((task: any) => 
        task.assigneeId === localStorage.getItem('userId') || 
        task.assignee?.id === localStorage.getItem('userId')
      );
      
      setMyTasks(currentUserTasks.slice(0, 5));
      setRecentTasks(allTasks.slice(0, 5));

      // Calculate statistics
      const taskStats = {
        total: allTasks.length,
        todo: allTasks.filter((t: any) => t.status === 'TODO').length,
        inProgress: allTasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
        review: allTasks.filter((t: any) => t.status === 'REVIEW').length,
        completed: allTasks.filter((t: any) => t.status === 'COMPLETED').length,
        overdue: allTasks.filter((t: any) => 
          t.dueDate && moment(t.dueDate).isBefore(moment(), 'day')
        ).length,
        myTasks: currentUserTasks.length,
        myCompleted: currentUserTasks.filter((t: any) => t.status === 'COMPLETED').length
      };

      setStats(taskStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'default';
      case 'IN_PROGRESS': return 'processing';
      case 'REVIEW': return 'warning';
      case 'COMPLETED': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'blue';
      case 'MEDIUM': return 'orange';
      case 'HIGH': return 'red';
      case 'URGENT': return 'red';
      default: return 'blue';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'TODO': return 'Chờ thực hiện';
      case 'IN_PROGRESS': return 'Đang thực hiện';
      case 'REVIEW': return 'Đang xem xét';
      case 'COMPLETED': return 'Hoàn thành';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'Thấp';
      case 'MEDIUM': return 'Trung bình';
      case 'HIGH': return 'Cao';
      case 'URGENT': return 'Khẩn cấp';
      default: return priority;
    }
  };

  const taskColumns = [
    {
      title: 'Tên công việc',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 'bold', cursor: 'pointer' }} 
               onClick={() => navigate(`/tasks/${record.id}`)}>
            {text}
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
      title: 'Dự án',
      dataIndex: ['project', 'name'],
      key: 'project',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge 
          status={getStatusColor(status) as any} 
          text={getStatusText(status)}
        />
      )
    },
    {
      title: 'Độ ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityText(priority)}
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
            <span style={{ 
              color: moment(date).isBefore(moment(), 'day') ? '#ff4d4f' : 'inherit' 
            }}>
              {moment(date).format('DD/MM/YYYY')}
            </span>
          </Space>
        ) : (
          <Text type="secondary">Không có hạn</Text>
        )
      )
    }
  ];

  const getCalendarData = (value: Dayjs) => {
    const date = value.format('YYYY-MM-DD');
    const dayTasks = myTasks.filter((task: any) => 
      task.dueDate && moment(task.dueDate).format('YYYY-MM-DD') === date
    );
    
    return dayTasks.map((task: any) => ({
      type: 'success',
      content: task.title,
      task
    }));
  };

  const dateCellRender = (value: Dayjs) => {
    const data = getCalendarData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {data.map((item, index) => (
          <li key={index} style={{ marginBottom: 3 }}>
            <Tooltip title={`${item.task.title} - ${getStatusText(item.task.status)}`}>
              <div
                style={{
                  fontSize: '10px',
                  padding: '1px 3px',
                  borderRadius: '2px',
                  backgroundColor: getStatusColor(item.task.status) === 'success' ? '#52c41a' : 
                                   getStatusColor(item.task.status) === 'processing' ? '#1890ff' :
                                   getStatusColor(item.task.status) === 'warning' ? '#faad14' : '#d9d9d9',
                  color: 'white',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => navigate(`/tasks/${item.task.id}`)}
              >
                {item.content}
              </div>
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  const completionRate = stats.myTasks > 0 ? (stats.myCompleted / stats.myTasks) * 100 : 0;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Dashboard</Title>
      
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng công việc"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Công việc của tôi"
              value={stats.myTasks}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đang thực hiện"
              value={stats.inProgress}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Quá hạn"
              value={stats.overdue}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* My Tasks Progress */}
        <Col xs={24} lg={12}>
          <Card 
            title="Tiến độ công việc của tôi" 
            extra={
              <Button type="link" onClick={() => navigate('/tasks')}>
                Xem tất cả <ArrowRightOutlined />
              </Button>
            }
          >
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text>Hoàn thành</Text>
                <Text>{Math.round(completionRate)}%</Text>
              </div>
              <Progress 
                percent={completionRate} 
                status={completionRate === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </div>
            
            <Table
              columns={taskColumns}
              dataSource={myTasks}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: 'Không có công việc nào được phân công'
              }}
            />
          </Card>
        </Col>

        {/* Recent Tasks */}
        <Col xs={24} lg={12}>
          <Card 
            title="Công việc gần đây" 
            extra={
              <Button type="link" onClick={() => navigate('/tasks')}>
                Xem tất cả <ArrowRightOutlined />
              </Button>
            }
          >
            <Table
              columns={taskColumns}
              dataSource={recentTasks}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: 'Không có công việc nào'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Calendar */}
      <Row style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="Lịch công việc">
            <Calendar 
              dateCellRender={dateCellRender}
              style={{ backgroundColor: 'white' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Task Status Overview */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Chờ thực hiện"
              value={stats.todo}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đang xem xét"
              value={stats.review}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={stats.completed}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tỷ lệ hoàn thành"
              value={stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 