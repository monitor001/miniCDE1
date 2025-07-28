import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, List, Avatar, Progress, Tag, Calendar, Badge, Spin, Alert, Drawer, Button, Input, message } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined, 
  ProjectOutlined, 
  ArrowUpOutlined, 
  UploadOutlined, 
  DownloadOutlined, 
  EyeOutlined, 
  CommentOutlined, 
  FileOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import moment from 'moment';
import io from 'socket.io-client';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import { useSelector } from 'react-redux';

const { Title, Text } = Typography;

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  totalDocuments: number;
  totalUsers: number;
  pendingApprovals: number;
  completedApprovals: number;
  rejectedApprovals: number;
  overdueTasks: number;
}

interface ProjectData {
  id: string;
  name: string;
  status: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  updatedAt: string;
}

interface ActivityData {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface TaskByProject {
  projectName: string;
  high: number;
  medium: number;
  low: number;
  none: number;
}

interface IssueByProject {
  projectName: string;
  high: number;
  medium: number;
  low: number;
  none: number;
}

interface DocumentByProject {
  projectName: string;
  published: number;
  shared: number;
  wip: number;
  archived: number;
}

interface EventByProject {
  projectName: string;
  todayEvents: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalTasks: 0,
    totalDocuments: 0,
    totalUsers: 0,
    pendingApprovals: 0,
    completedApprovals: 0,
    rejectedApprovals: 0,
    overdueTasks: 0
  });
  const [recentActivities, setRecentActivities] = useState<ActivityData[]>([]);
  const [recentProjects, setRecentProjects] = useState<ProjectData[]>([]);
  const [taskByProjectData, setTaskByProjectData] = useState<any>({});
  const [issueByProjectData, setIssueByProjectData] = useState<any>({});
  const [documentByProjectData, setDocumentByProjectData] = useState<any>({});
  const [eventByProjectData, setEventByProjectData] = useState<any>({});
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isDarkMode = useSelector((state: any) => state.ui.theme === 'dark' || (state.ui.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [
        statsRes,
        tasksByProjectRes,
        issuesByProjectRes,
        documentsByProjectRes,
        todayEventsRes
      ] = await Promise.all([
        axiosInstance.get('/dashboard/stats'),
        axiosInstance.get('/dashboard/tasks-by-project'),
        axiosInstance.get('/dashboard/issues-by-project'),
        axiosInstance.get('/dashboard/documents-by-project'),
        axiosInstance.get('/dashboard/today-events')
      ]);

      setStats(statsRes.data.stats);
      setRecentActivities(statsRes.data.recentActivities || []);

      // Task by Project chart (Grouped Bar chart)
      const taskData = tasksByProjectRes.data || [];
      const taskLabels = taskData.map((d: TaskByProject) => d.projectName);
      setTaskByProjectData({
        labels: taskLabels,
        datasets: [
          {
            label: 'Cao',
            data: taskData.map((d: TaskByProject) => d.high),
            backgroundColor: '#ff4d4f',
            borderWidth: 1
          },
          {
            label: 'Trung bình',
            data: taskData.map((d: TaskByProject) => d.medium),
            backgroundColor: '#faad14',
            borderWidth: 1
          },
          {
            label: 'Thấp',
            data: taskData.map((d: TaskByProject) => d.low),
            backgroundColor: '#1890ff',
            borderWidth: 1
          },
          {
            label: 'Không',
            data: taskData.map((d: TaskByProject) => d.none),
            backgroundColor: '#bfbfbf',
            borderWidth: 1
          }
        ]
      });

      // Issue by Project chart (Grouped Bar chart)
      const issueData = issuesByProjectRes.data || [];
      const issueLabels = issueData.map((d: IssueByProject) => d.projectName);
      setIssueByProjectData({
        labels: issueLabels,
        datasets: [
          {
            label: 'Cao',
            data: issueData.map((d: IssueByProject) => d.high),
            backgroundColor: '#ff4d4f',
            borderWidth: 1
          },
          {
            label: 'Trung bình',
            data: issueData.map((d: IssueByProject) => d.medium),
            backgroundColor: '#faad14',
            borderWidth: 1
          },
          {
            label: 'Thấp',
            data: issueData.map((d: IssueByProject) => d.low),
            backgroundColor: '#1890ff',
            borderWidth: 1
          },
          {
            label: 'Không',
            data: issueData.map((d: IssueByProject) => d.none),
            backgroundColor: '#bfbfbf',
            borderWidth: 1
          }
        ]
      });

      // Document by Project chart (Bar chart)
      const documentData = documentsByProjectRes.data || [];
      const documentLabels = documentData.map((d: DocumentByProject) => d.projectName);
      setDocumentByProjectData({
        labels: documentLabels,
        datasets: [
          {
            label: 'Đã xuất bản',
            data: documentData.map((d: DocumentByProject) => d.published),
            backgroundColor: '#52c41a',
            borderWidth: 1
          },
          {
            label: 'Đã chia sẻ',
            data: documentData.map((d: DocumentByProject) => d.shared),
            backgroundColor: '#1890ff',
            borderWidth: 1
          },
          {
            label: 'Đang làm việc',
            data: documentData.map((d: DocumentByProject) => d.wip),
            backgroundColor: '#faad14',
            borderWidth: 1
          },
          {
            label: 'Đã lưu trữ',
            data: documentData.map((d: DocumentByProject) => d.archived),
            backgroundColor: '#8c8c8c',
            borderWidth: 1
          }
        ]
      });
      setTodayEvents(todayEventsRes.data.events || []);

    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001');
    socket.on('activity:new', (activity: any) => {
      setRecentActivities(prev => [activity, ...prev.slice(0, 9)]);
    });
    return () => { socket.disconnect(); };
  }, []);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'upload': return <UploadOutlined style={{ color: '#1890ff' }} />;
      case 'download': return <DownloadOutlined style={{ color: '#722ed1' }} />;
      case 'view': return <EyeOutlined style={{ color: '#8c8c8c' }} />;
      case 'comment': return <CommentOutlined style={{ color: '#52c41a' }} />;
      case 'create': return <ProjectOutlined style={{ color: '#1890ff' }} />;
      case 'update': return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'delete': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default: return <ProjectOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#52c41a';
      case 'COMPLETED': return '#1890ff';
      case 'ON_HOLD': return '#faad14';
      case 'CANCELLED': return '#ff4d4f';
      default: return '#8c8c8c';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#ff4d4f';
      case 'HIGH': return '#faad14';
      case 'MEDIUM': return '#1890ff';
      case 'LOW': return '#52c41a';
      default: return '#8c8c8c';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải dữ liệu dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ color: isDarkMode ? '#fff' : '#222', marginBottom: 24 }}>
        <BarChartOutlined style={{ marginRight: 8 }} />
        Dashboard Tổng Quan
      </Title>

      {error && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Statistics Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: isDarkMode ? '#223355' : '#f5faff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ProjectOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <Statistic 
                title="Tổng Dự Án" 
                value={stats.totalProjects} 
                valueStyle={{ color: '#1890ff', fontWeight: 700 }} 
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: isDarkMode ? '#2d2d2d' : '#fffbe6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14' }} />
              <Statistic 
                title="Công Việc Đang Thực Hiện" 
                value={stats.totalTasks} 
                valueStyle={{ color: '#faad14', fontWeight: 700 }} 
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: isDarkMode ? '#1e3a2a' : '#f6ffed' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <FileOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <Statistic 
                title="Tài Liệu" 
                value={stats.totalDocuments} 
                valueStyle={{ color: '#52c41a', fontWeight: 700 }} 
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: isDarkMode ? '#3a2323' : '#fff1f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ExclamationCircleOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
              <Statistic 
                title="Công Việc Trễ Hạn" 
                value={stats.overdueTasks} 
                valueStyle={{ color: '#ff4d4f', fontWeight: 700 }} 
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 - Tasks and Issues by Project */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card 
            title={<span><BarChartOutlined /> Nhiệm Vụ Theo Dự Án</span>} 
            bordered
          >
            {taskByProjectData.labels && taskByProjectData.labels.length > 0 ? (
              <Bar 
                data={taskByProjectData} 
                options={{ 
                  plugins: { 
                    legend: { position: 'top' },
                    title: { display: false }
                  },
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      stacked: false,
                    },
                    y: { 
                      beginAtZero: true,
                      stacked: false
                    }
                  }
                }} 
                height={300}
              />
            ) : (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                Chưa có dữ liệu nhiệm vụ
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={<span><ExclamationCircleOutlined /> Vấn Đề Theo Dự Án</span>} 
            bordered
          >
            {issueByProjectData.labels && issueByProjectData.labels.length > 0 ? (
              <Bar 
                data={issueByProjectData} 
                options={{ 
                  plugins: { 
                    legend: { position: 'top' },
                    title: { display: false }
                  },
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      stacked: false,
                    },
                    y: { 
                      beginAtZero: true,
                      stacked: false
                    }
                  }
                }} 
                height={300}
              />
            ) : (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                Chưa có dữ liệu vấn đề
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 - Documents and Events by Project */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card 
            title={<span><FileOutlined /> Tài Liệu Theo Dự Án</span>} 
            bordered
          >
            {documentByProjectData.labels && documentByProjectData.labels.length > 0 ? (
              <Bar 
                data={documentByProjectData} 
                options={{ 
                  plugins: { 
                    legend: { position: 'top' },
                    title: { display: false }
                  },
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      stacked: true,
                    },
                    y: { 
                      beginAtZero: true,
                      stacked: true
                    }
                  }
                }} 
                height={300}
              />
            ) : (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                Chưa có dữ liệu tài liệu
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={<span><CalendarOutlined /> Sự Kiện Hôm Nay</span>} 
            bordered
          >
            {todayEvents.length > 0 ? (
              <List
                dataSource={todayEvents}
                renderItem={(event: any) => (
                  <List.Item>
                    <Card style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{event.title}</span>
                        <span style={{ color: '#722ed1', fontWeight: 700 }}>
                          {moment(event.startDate).format('HH:mm')} - {moment(event.endDate).format('HH:mm')}
                        </span>
                      </div>
                      {event.description && (
                        <div style={{ marginTop: 8, color: '#888' }}>{event.description}</div>
                      )}
                    </Card>
                  </List.Item>
                )}
                locale={{ emptyText: 'Không có sự kiện nào hôm nay' }}
              />
            ) : (
              <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                Không có sự kiện nào hôm nay
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 