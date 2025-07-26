import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Row, Col, Card, Statistic, List, Typography, Tag, Timeline, Progress, Spin } from 'antd';
import {
  ProjectOutlined,
  FileOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  FileDoneOutlined,
  WarningOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useQuery } from 'react-query';

import { RootState } from '../store';
import axiosInstance from '../axiosConfig';

const { Title, Text } = Typography;

// Types
interface Project {
  id: string;
  name: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  project: {
    id: string;
    name: string;
  };
}

interface Document {
  id: string;
  name: string;
  status: string;
  uploadDate: string;
  uploader: {
    name: string;
  };
}

interface Activity {
  id: string;
  type: string;
  action: string;
  user: string;
  target: string;
  time: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery('dashboardData', async () => {
    try {
      const response = await axiosInstance.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return null;
    }
  });
  
  // Mock data for development
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  useEffect(() => {
    // If API returns data, use it, otherwise use mock data
    if (dashboardData) {
      setProjects(dashboardData.projects);
      setTasks(dashboardData.tasks);
      setDocuments(dashboardData.documents);
      setActivities(dashboardData.activities);
    } else {
      // Mock data
      setProjects([
        { id: '1', name: 'Office Building Project', status: 'ACTIVE' },
        { id: '2', name: 'Residential Complex', status: 'PLANNING' }
      ]);
      
      setTasks([
        {
          id: '1',
          title: 'Review architectural plans',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          dueDate: '2024-03-15',
          project: { id: '1', name: 'Office Building Project' }
        },
        {
          id: '2',
          title: 'Update structural analysis',
          status: 'TODO',
          priority: 'MEDIUM',
          dueDate: '2024-03-20',
          project: { id: '1', name: 'Office Building Project' }
        },
        {
          id: '3',
          title: 'Coordinate MEP systems',
          status: 'COMPLETED',
          priority: 'URGENT',
          dueDate: '2024-03-10',
          project: { id: '1', name: 'Office Building Project' }
        }
      ]);
      
      setDocuments([
        {
          id: '1',
          name: 'Architectural Plans',
          status: 'WORK_IN_PROGRESS',
          uploadDate: '2024-03-01',
          uploader: { name: 'John Architect' }
        },
        {
          id: '2',
          name: 'Structural Analysis',
          status: 'SHARED',
          uploadDate: '2024-03-05',
          uploader: { name: 'Sarah Engineer' }
        },
        {
          id: '3',
          name: 'MEP Coordination',
          status: 'PUBLISHED',
          uploadDate: '2024-03-08',
          uploader: { name: 'MEP Team' }
        }
      ]);
      
      setActivities([
        {
          id: '1',
          type: 'document',
          action: 'uploaded',
          user: 'John Architect',
          target: 'Architectural Plans',
          time: '10 minutes ago'
        },
        {
          id: '2',
          type: 'task',
          action: 'completed',
          user: 'MEP Team',
          target: 'Coordinate MEP systems',
          time: '2 hours ago'
        },
        {
          id: '3',
          type: 'project',
          action: 'created',
          user: 'Project Manager',
          target: 'Residential Complex',
          time: '1 day ago'
        }
      ]);
    }
  }, [dashboardData]);
  
  // Get task status counts
  const taskStatusCounts = {
    todo: tasks.filter(task => task.status === 'TODO').length,
    inProgress: tasks.filter(task => task.status === 'IN_PROGRESS').length,
    review: tasks.filter(task => task.status === 'REVIEW').length,
    completed: tasks.filter(task => task.status === 'COMPLETED').length
  };
  
  // Get document status counts
  const documentStatusCounts = {
    workInProgress: documents.filter(doc => doc.status === 'WORK_IN_PROGRESS').length,
    shared: documents.filter(doc => doc.status === 'SHARED').length,
    published: documents.filter(doc => doc.status === 'PUBLISHED').length,
    archived: documents.filter(doc => doc.status === 'ARCHIVED').length
  };
  
  // Get task priority tag color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'green';
      case 'MEDIUM':
        return 'blue';
      case 'HIGH':
        return 'orange';
      case 'URGENT':
        return 'red';
      default:
        return 'default';
    }
  };
  
  // Get document status tag color
  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'WORK_IN_PROGRESS':
        return 'blue';
      case 'SHARED':
        return 'orange';
      case 'PUBLISHED':
        return 'green';
      case 'ARCHIVED':
        return 'default';
      default:
        return 'default';
    }
  };
  
  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'task':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'project':
        return <ProjectOutlined style={{ color: '#722ed1' }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>{t('dashboard.welcome')}, {user?.name}!</Title>
      
      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('navigation.projects')}
              value={projects.length}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('navigation.documents')}
              value={documents.length}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('navigation.tasks')}
              value={tasks.length}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('navigation.users')}
              value={5} // Mock value
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Tasks and Documents */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Upcoming Tasks */}
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.upcomingTasks')} style={{ height: '100%' }}>
            <List
              dataSource={tasks.filter(task => task.status !== 'COMPLETED').slice(0, 5)}
              renderItem={task => (
                <List.Item
                  actions={[
                    <Tag color={getPriorityColor(task.priority)}>
                      {t(`tasks.priority.${task.priority.toLowerCase()}`)}
                    </Tag>
                  ]}
                >
                  <List.Item.Meta
                    title={<a href={`/tasks/${task.id}`}>{task.title}</a>}
                    description={
                      <>
                        <Text type="secondary">{task.project.name}</Text>
                        <br />
                        <Text type="secondary">
                          <ClockCircleOutlined /> {new Date(task.dueDate).toLocaleDateString()}
                        </Text>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        {/* Recent Documents */}
        <Col xs={24} lg={12}>
          <Card title={t('navigation.documents')} style={{ height: '100%' }}>
            <List
              dataSource={documents.slice(0, 5)}
              renderItem={doc => (
                <List.Item
                  actions={[
                    <Tag color={getDocumentStatusColor(doc.status)}>
                      {t(`documents.status.${doc.status.toLowerCase()}`)}
                    </Tag>
                  ]}
                >
                  <List.Item.Meta
                    title={<a href={`/documents/${doc.id}`}>{doc.name}</a>}
                    description={
                      <>
                        <Text type="secondary">
                          <UserOutlined /> {doc.uploader.name}
                        </Text>
                        <br />
                        <Text type="secondary">
                          <ClockCircleOutlined /> {new Date(doc.uploadDate).toLocaleDateString()}
                        </Text>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Status Charts and Activity */}
      <Row gutter={[16, 16]}>
        {/* Task Status */}
        <Col xs={24} md={8}>
          <Card title={t('dashboard.taskStatus')} style={{ height: '100%' }}>
            <div style={{ marginBottom: 16 }}>
              <Text>{t('tasks.status.todo')}</Text>
              <Progress 
                percent={Math.round((taskStatusCounts.todo / tasks.length) * 100)} 
                strokeColor="#1890ff" 
                showInfo={false} 
              />
              <div style={{ textAlign: 'right' }}>
                <Tag color="blue">{taskStatusCounts.todo}</Tag>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text>{t('tasks.status.inProgress')}</Text>
              <Progress 
                percent={Math.round((taskStatusCounts.inProgress / tasks.length) * 100)} 
                strokeColor="#faad14" 
                showInfo={false} 
              />
              <div style={{ textAlign: 'right' }}>
                <Tag color="orange">{taskStatusCounts.inProgress}</Tag>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text>{t('tasks.status.review')}</Text>
              <Progress 
                percent={Math.round((taskStatusCounts.review / tasks.length) * 100)} 
                strokeColor="#722ed1" 
                showInfo={false} 
              />
              <div style={{ textAlign: 'right' }}>
                <Tag color="purple">{taskStatusCounts.review}</Tag>
              </div>
            </div>
            
            <div>
              <Text>{t('tasks.status.completed')}</Text>
              <Progress 
                percent={Math.round((taskStatusCounts.completed / tasks.length) * 100)} 
                strokeColor="#52c41a" 
                showInfo={false} 
              />
              <div style={{ textAlign: 'right' }}>
                <Tag color="green">{taskStatusCounts.completed}</Tag>
              </div>
            </div>
          </Card>
        </Col>
        
        {/* Document Status */}
        <Col xs={24} md={8}>
          <Card title={t('dashboard.documentStatus')} style={{ height: '100%' }}>
            <div style={{ marginBottom: 16 }}>
              <Text>{t('documents.status.workInProgress')}</Text>
              <Progress 
                percent={Math.round((documentStatusCounts.workInProgress / documents.length) * 100)} 
                strokeColor="#1890ff" 
                showInfo={false} 
              />
              <div style={{ textAlign: 'right' }}>
                <Tag color="blue">{documentStatusCounts.workInProgress}</Tag>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text>{t('documents.status.shared')}</Text>
              <Progress 
                percent={Math.round((documentStatusCounts.shared / documents.length) * 100)} 
                strokeColor="#faad14" 
                showInfo={false} 
              />
              <div style={{ textAlign: 'right' }}>
                <Tag color="orange">{documentStatusCounts.shared}</Tag>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text>{t('documents.status.published')}</Text>
              <Progress 
                percent={Math.round((documentStatusCounts.published / documents.length) * 100)} 
                strokeColor="#52c41a" 
                showInfo={false} 
              />
              <div style={{ textAlign: 'right' }}>
                <Tag color="green">{documentStatusCounts.published}</Tag>
              </div>
            </div>
            
            <div>
              <Text>{t('documents.status.archived')}</Text>
              <Progress 
                percent={Math.round((documentStatusCounts.archived / documents.length) * 100)} 
                strokeColor="#d9d9d9" 
                showInfo={false} 
              />
              <div style={{ textAlign: 'right' }}>
                <Tag>{documentStatusCounts.archived}</Tag>
              </div>
            </div>
          </Card>
        </Col>
        
        {/* Recent Activity */}
        <Col xs={24} md={8}>
          <Card title={t('dashboard.recentActivity')} style={{ height: '100%' }}>
            <Timeline
              items={activities.map(activity => ({
                color: activity.type === 'document' ? 'blue' : activity.type === 'task' ? 'green' : 'purple',
                dot: getActivityIcon(activity.type),
                children: (
                  <div>
                    <Text strong>{activity.user}</Text> {activity.action} <Text strong>{activity.target}</Text>
                    <br />
                    <Text type="secondary">{activity.time}</Text>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 