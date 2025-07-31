import React, { useState, useEffect } from 'react';
import { 
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Progress,
  Avatar,
  Space,
  Button,
  Divider,
  Statistic,
  List,
  Tooltip,
  Badge,
  Timeline,
  Descriptions,
  Tabs,
  Table,
  message
} from 'antd';
import { 
  FolderOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  MessageOutlined,
  SettingOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

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
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  status: 'ACTIVE' | 'INACTIVE';
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
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<ProjectComment[]>([]);

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchComments();
    }
  }, [id]);
  
  const fetchProjectDetails = async () => {
    try {
      const response = await axiosInstance.get(`/projects/${id}`);
      setProject(response.data);
        } catch (error) {
      console.error('Error fetching project details:', error);
      message.error('Không thể tải thông tin dự án!');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axiosInstance.get(`/projects/${id}/comments`);
      let commentsData = [];
      if (response.data && Array.isArray(response.data)) {
        commentsData = response.data;
      } else if (response.data && response.data.comments && Array.isArray(response.data.comments)) {
        commentsData = response.data.comments;
      }
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    }
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string; icon: React.ReactNode } } = {
      'ACTIVE': { label: 'Đang thực hiện', color: 'green', icon: <CheckCircleOutlined /> },
      'PLANNING': { label: 'Lập kế hoạch', color: 'blue', icon: <ClockCircleOutlined /> },
      'ON_HOLD': { label: 'Tạm dừng', color: 'orange', icon: <ExclamationCircleOutlined /> },
      'COMPLETED': { label: 'Hoàn thành', color: 'purple', icon: <CheckCircleOutlined /> },
      'ARCHIVED': { label: 'Lưu trữ', color: 'grey', icon: <ExclamationCircleOutlined /> }
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

  const handleEdit = () => {
    navigate(`/projects/edit/${id}`);
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/projects/${id}`);
      message.success('Đã xóa dự án!');
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      message.error('Lỗi khi xóa dự án!');
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (!project) {
    return <div>Không tìm thấy dự án</div>;
  }

  const statusInfo = getStatusDisplay(project.status);
  const priorityInfo = getPriorityDisplay(project.priority);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/projects')}
          >
            Quay lại
          </Button>
          <div>
            <Title level={2} style={{ margin: 0 }}>{project.name}</Title>
            <Text type="secondary">{project.description}</Text>
          </div>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />}>
            Xuất Báo Cáo
          </Button>
          <Button icon={<EditOutlined />} onClick={handleEdit}>
            Chỉnh sửa
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            Xóa
          </Button>
        </Space>
          </div>

      {/* Project Overview */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="Thông tin dự án">
            <Descriptions column={2}>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusInfo.color} icon={statusInfo.icon}>
                  {statusInfo.label}
                </Tag>
          </Descriptions.Item>
              <Descriptions.Item label="Mức độ ưu tiên">
                <Tag color={priorityInfo.color}>
                  {priorityInfo.label}
                </Tag>
          </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">
                {moment(project.startDate).format('DD/MM/YYYY')}
          </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">
                {moment(project.endDate).format('DD/MM/YYYY')}
          </Descriptions.Item>
              <Descriptions.Item label="Quản lý dự án">
                {project.manager}
          </Descriptions.Item>
              <Descriptions.Item label="Số thành viên">
                {project.teamSize}
          </Descriptions.Item>
        </Descriptions>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Tiến độ dự án">
            <div style={{ textAlign: 'center' }}>
              <Progress 
                type="circle" 
                percent={project.progress} 
                size={120}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <div style={{ marginTop: 16 }}>
                <Text strong>{project.progress}% hoàn thành</Text>
              </div>
          </div>
          </Card>
        </Col>
      </Row>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tài liệu"
              value={project.documents}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Nhiệm vụ"
              value={project.tasks}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Vấn đề"
              value={project.issues}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Thành viên"
              value={project.members?.length || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Information */}
      <Tabs defaultActiveKey="members">
        <TabPane tab="Thành viên" key="members">
          <Card>
          <Table 
              dataSource={project.members || []}
            columns={[
              {
                  title: 'Thành viên',
                  key: 'user',
                  render: (record: ProjectMember) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar size={32}>
                        {(record.userName || 'U').charAt(0)}
                      </Avatar>
                      <div>
                        <div style={{ fontWeight: 500 }}>{record.userName || 'Unknown'}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{record.userEmail || 'No email'}</div>
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Vai trò',
                dataIndex: 'role',
                key: 'role',
                  render: (role: string) => {
                    const roleColors = {
                      'OWNER': 'red',
                      'MANAGER': 'orange',
                      'MEMBER': 'blue',
                      'VIEWER': 'green'
                    };
                    return <Tag color={roleColors[role as keyof typeof roleColors]}>{role}</Tag>;
                  }
                },
                {
                  title: 'Ngày tham gia',
                  dataIndex: 'joinedAt',
                  key: 'joinedAt',
                  render: (date: string) => moment(date).format('DD/MM/YYYY')
                },
                {
                  title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                  render: (status: string) => (
                    <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
                      {status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                    </Tag>
                  )
                }
              ]}
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab="Bình luận" key="comments">
          <Card
            style={{
              background:
                project?.priority === 'HIGH' ? 'linear-gradient(135deg, #ffeaea 0%, #ffd6d6 100%)'
                : project?.priority === 'MEDIUM' ? 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)'
                : project?.priority === 'LOW' ? 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)'
                : 'linear-gradient(135deg, #f5f5f5 0%, #e6e6e6 100%)',
              border: project?.priority === 'HIGH' ? '1.5px solid #ff7875'
                : project?.priority === 'MEDIUM' ? '1.5px solid #faad14'
                : project?.priority === 'LOW' ? '1.5px solid #1890ff'
                : '1.5px solid #d9d9d9',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
                  Chưa có bình luận nào
          </div>
              ) : (
          <List
                  dataSource={comments}
                  renderItem={(comment) => (
                    <List.Item>
                <List.Item.Meta
                  avatar={
                          <Avatar
                            style={{
                              background:
                                project?.priority === 'HIGH' ? 'linear-gradient(135deg, #ff7875 0%, #ffa39e 100%)'
                                : project?.priority === 'MEDIUM' ? 'linear-gradient(135deg, #faad14 0%, #ffe58f 100%)'
                                : project?.priority === 'LOW' ? 'linear-gradient(135deg, #1890ff 0%, #91d5ff 100%)'
                                : 'linear-gradient(135deg, #bfbfbf 0%, #e6e6e6 100%)',
                              color: '#fff', fontWeight: 700
                            }}
                          >
                            {(comment.authorName || 'U').charAt(0)}
                    </Avatar>
                  }
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{comment.authorName || 'Unknown'}</span>
                            <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                              {moment(comment.createdAt).format('DD/MM/YYYY HH:mm')}
                            </span>
                          </div>
                        }
                        description={
                          <div style={{
                            background: 'rgba(255,255,255,0.7)',
                            borderRadius: 8,
                            padding: 12,
                            border:
                              project?.priority === 'HIGH' ? '1px solid #ff7875'
                              : project?.priority === 'MEDIUM' ? '1px solid #faad14'
                              : project?.priority === 'LOW' ? '1px solid #1890ff'
                              : '1px solid #d9d9d9',
                            color: '#333',
                            fontSize: 14
                          }}>{comment.content}</div>
                        }
                />
              </List.Item>
            )}
                />
              )}
            </div>
          </Card>
        </TabPane>

        <TabPane tab="Phân quyền" key="permissions">
          <Card>
            <Table
              dataSource={project.permissions || []}
              columns={[
                {
                  title: 'Thành viên',
                  key: 'user',
                  render: (record: ProjectPermission) => {
                    const member = (project.members || []).find(m => m.userId === record.userId);
                    return member ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size={32}>
                          {(member.userName || 'U').charAt(0)}
                        </Avatar>
                        <div>
                          <div style={{ fontWeight: 500 }}>{member.userName || 'Unknown'}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{member.userEmail || 'No email'}</div>
                        </div>
                      </div>
                    ) : 'Không xác định';
                  }
                },
                {
                  title: 'Quyền',
                  dataIndex: 'permission',
                  key: 'permission',
                  render: (permission: string) => {
                    const permissionColors = {
                      'ADMIN': 'red',
                      'WRITE': 'orange',
                      'READ': 'blue',
                      'DELETE': 'purple'
                    };
                    return <Tag color={permissionColors[permission as keyof typeof permissionColors]}>{permission}</Tag>;
                  }
                },
                {
                  title: 'Tài nguyên',
                  dataIndex: 'resource',
                  key: 'resource',
                  render: (resource: string) => {
                    const resourceLabels = {
                      'PROJECT': 'Dự án',
                      'DOCUMENTS': 'Tài liệu',
                      'TASKS': 'Nhiệm vụ',
                      'ISSUES': 'Vấn đề',
                      'CALENDAR': 'Lịch'
                    };
                    return resourceLabels[resource as keyof typeof resourceLabels] || resource;
                  }
                },
                {
                  title: 'Ngày cấp',
                  dataIndex: 'grantedAt',
                  key: 'grantedAt',
                  render: (date: string) => moment(date).format('DD/MM/YYYY')
                }
              ]}
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ProjectDetail; 