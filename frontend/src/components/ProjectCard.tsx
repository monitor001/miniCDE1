import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Tag,
  Space,
  Popconfirm,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Avatar,
  List,
  Drawer,
  Mentions,
  Tooltip,
  Dropdown,
  Menu,
  Badge,
  Divider,
  Typography,
  Row,
  Col,
  Statistic,
  Progress
} from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  FileOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  MessageOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  ExportOutlined,
  MoreOutlined,
  CommentOutlined,
  ShareAltOutlined,
  SettingOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  PrinterOutlined,
  CopyOutlined,
  LinkOutlined
} from '@ant-design/icons';
import moment from 'moment';
import axiosInstance from '../axiosConfig';
import { useSelector } from 'react-redux';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface ProjectCardProps {
  project: any;
  onEdit: (project: any) => void;
  onDelete: (id: string) => void;
  onView: (project: any) => void;
  onRefresh: () => void;
  isDarkMode?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  isDarkMode = false
}) => {
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentValue, setCommentValue] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareForm] = Form.useForm();
  const [projectStats, setProjectStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const currentUser = useSelector((state: any) => state.auth.user);

  // Priority levels configuration
  const priorityLevels = [
    { value: 'HIGH', label: 'Cao', color: 'red' },
    { value: 'MEDIUM', label: 'Trung bình', color: 'orange' },
    { value: 'LOW', label: 'Thấp', color: 'green' },
    { value: 'NONE', label: 'Không', color: 'default' }
  ];

  // Helper functions
  const getPriorityColor = (priority: string) => {
    const priorityInfo = priorityLevels.find(p => p.value === priority);
    return priorityInfo ? priorityInfo.color : 'default';
  };

  const getPriorityLabel = (priority: string) => {
    const priorityInfo = priorityLevels.find(p => p.value === priority);
    return priorityInfo ? priorityInfo.label : 'Không';
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'blue';
      case 'COMPLETED':
        return 'green';
      case 'ON_HOLD':
        return 'gold';
      case 'CANCELLED':
        return 'red';
      default:
        return 'default';
    }
  };

  // Fetch project statistics
  const fetchProjectStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axiosInstance.get(`/projects/${project.id}/stats`);
      setProjectStats(response.data);
    } catch (error) {
      console.error('Error fetching project stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    try {
      const response = await axiosInstance.get(`/projects/${project.id}/comments`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      message.error('Không thể tải bình luận');
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!commentValue.trim()) return;

    try {
      setCommentLoading(true);
      await axiosInstance.post(`/projects/${project.id}/comments`, {
        content: commentValue
      });
      setCommentValue('');
      await fetchComments();
      message.success('Bình luận đã được thêm');
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error('Không thể thêm bình luận');
    } finally {
      setCommentLoading(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await axiosInstance.delete(`/projects/${project.id}/comments/${commentId}`);
      await fetchComments();
      message.success('Bình luận đã được xóa');
    } catch (error) {
      console.error('Error deleting comment:', error);
      message.error('Không thể xóa bình luận');
    }
  };

  // Export project
  const handleExport = async (format: string) => {
    try {
      setExportLoading(true);
      const response = await axiosInstance.get(`/projects/${project.id}/export`, {
        params: { format },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${project.name}_${format.toUpperCase()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success(`Dự án đã được xuất thành công (${format.toUpperCase()})`);
    } catch (error) {
      console.error('Error exporting project:', error);
      message.error('Không thể xuất dự án');
    } finally {
      setExportLoading(false);
    }
  };

  // Share project
  const handleShare = async (values: any) => {
    try {
      await axiosInstance.post(`/projects/${project.id}/share`, values);
      message.success('Dự án đã được chia sẻ');
      setShareModalOpen(false);
      shareForm.resetFields();
    } catch (error) {
      console.error('Error sharing project:', error);
      message.error('Không thể chia sẻ dự án');
    }
  };

  // Copy project link
  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/projects/${project.id}`;
      await navigator.clipboard.writeText(link);
      message.success('Đã sao chép liên kết dự án');
    } catch (error) {
      console.error('Error copying link:', error);
      message.error('Không thể sao chép liên kết');
    }
  };

  // Open comment drawer
  const openCommentDrawer = () => {
    setCommentDrawerOpen(true);
    fetchComments();
  };

  // Export menu items
  const exportMenuItems = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Xuất Excel',
      onClick: () => handleExport('xlsx')
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: 'Xuất PDF',
      onClick: () => handleExport('pdf')
    },
    {
      key: 'word',
      icon: <FileWordOutlined />,
      label: 'Xuất Word',
      onClick: () => handleExport('docx')
    },
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'In dự án',
      onClick: () => window.print()
    }
  ];

  // Action menu items
  const actionMenuItems = [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Xem chi tiết',
      onClick: () => onView(project)
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Chỉnh sửa',
      onClick: () => onEdit(project)
    },
    {
      key: 'comments',
      icon: <CommentOutlined />,
      label: (
        <Badge count={comments.length} size="small">
          <span>Bình luận</span>
        </Badge>
      ),
      onClick: openCommentDrawer
    },
    {
      key: 'share',
      icon: <ShareAltOutlined />,
      label: 'Chia sẻ',
      onClick: () => setShareModalOpen(true)
    },
    {
      key: 'copy-link',
      icon: <LinkOutlined />,
      label: 'Sao chép liên kết',
      onClick: handleCopyLink
    },
    {
      type: 'divider' as const
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Xóa dự án',
      danger: true,
      onClick: () => onDelete(project.id)
    }
  ];

  // Calculate progress
  const calculateProgress = () => {
    if (!projectStats) return 0;
    const totalTasks = projectStats.totalTasks || 0;
    const completedTasks = projectStats.completedTasks || 0;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  return (
    <>
      <Card
        hoverable
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text strong style={{ color: isDarkMode ? '#fff' : '#000' }}>
              {project.name}
            </Text>
            <Dropdown
              menu={{ items: actionMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<MoreOutlined />}
                size="small"
                style={{ color: isDarkMode ? '#fff' : '#000' }}
              />
            </Dropdown>
          </div>
        }
        extra={
          <Space>
            <Tag color={getPriorityColor(project.priority)}>
              {getPriorityLabel(project.priority)}
            </Tag>
            <Tag
              icon={getStatusIcon(project.status)}
              color={getStatusColor(project.status)}
            >
              {getStatusLabel(project.status)}
            </Tag>
          </Space>
        }
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
          background: isDarkMode ? '#1f1f1f' : undefined
        }}
        bodyStyle={{
          borderRadius: 16,
          minHeight: 120,
          background: isDarkMode ? '#141414' : '#fafdff',
          transition: 'background 0.2s'
        }}
        className="project-card-highlight"
        onMouseEnter={fetchProjectStats}
      >
        {/* Project Description */}
        {project.description && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {project.description.length > 100 
                ? `${project.description.substring(0, 100)}...` 
                : project.description
              }
            </Text>
          </div>
        )}

        {/* Project Statistics */}
        {projectStats && (
          <div style={{ marginBottom: 12 }}>
            <Row gutter={8}>
              <Col span={8}>
                <Statistic
                  title="Công việc"
                  value={projectStats.totalTasks || 0}
                  suffix={`/ ${projectStats.completedTasks || 0}`}
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Tài liệu"
                  value={projectStats.totalDocuments || 0}
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Thành viên"
                  value={project.members?.length || 0}
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
            </Row>
            <Progress
              percent={calculateProgress()}
              size="small"
              status={project.status === 'COMPLETED' ? 'success' : 'active'}
            />
          </div>
        )}

        {/* Project Dates */}
        <div style={{ marginBottom: 8 }}>
          <CalendarOutlined style={{ marginRight: 8, color: isDarkMode ? '#aaa' : '#666' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {project.startDate && moment(project.startDate).isValid()
              ? moment(project.startDate).format('DD/MM/YYYY')
              : '-'
            }
            {' → '}
            {project.endDate && moment(project.endDate).isValid()
              ? moment(project.endDate).format('DD/MM/YYYY')
              : '-'
            }
          </Text>
        </div>

        {/* Project Members */}
        <div style={{ marginBottom: 8 }}>
          <TeamOutlined style={{ marginRight: 8, color: isDarkMode ? '#aaa' : '#666' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {project.members && Array.isArray(project.members) && project.members.length > 0
              ? `${project.members.length} thành viên`
              : 'Chưa có thành viên'
            }
          </Text>
        </div>

        {/* Project Resources */}
        {project._count && (
          <div style={{ marginBottom: 8 }}>
            <FileOutlined style={{ marginRight: 8, color: isDarkMode ? '#aaa' : '#666' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {project._count.documents || 0} tài liệu, {project._count.tasks || 0} công việc
            </Text>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<CommentOutlined />}
              onClick={openCommentDrawer}
              style={{ color: isDarkMode ? '#fff' : '#1890ff' }}
            >
              {comments.length > 0 && (
                <Badge count={comments.length} size="small" />
              )}
            </Button>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(project)}
              style={{ color: isDarkMode ? '#fff' : '#1890ff' }}
            />
          </Space>
          
          <Dropdown
            menu={{ items: exportMenuItems }}
            trigger={['click']}
            placement="topRight"
          >
            <Button
              type="text"
              size="small"
              icon={<ExportOutlined />}
              loading={exportLoading}
              style={{ color: isDarkMode ? '#fff' : '#1890ff' }}
            />
          </Dropdown>
        </div>
      </Card>

      {/* Comments Drawer */}
      <Drawer
        title={`Bình luận - ${project.name}`}
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
            locale={{ emptyText: 'Chưa có bình luận nào.' }}
            renderItem={(item: any) => (
              <List.Item style={{
                background: item.user?.id === currentUser?.id 
                  ? (isDarkMode ? '#223355' : '#e6f7ff') 
                  : (isDarkMode ? '#232428' : '#fff'),
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 11, color: isDarkMode ? '#aaa' : '#888' }}>
                    {moment(item.createdAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                  {item.user?.id === currentUser?.id && (
                    <Button
                      type="text"
                      size="small"
                      danger
                      onClick={() => handleDeleteComment(item.id)}
                      style={{ padding: 0, height: 'auto', fontSize: 11 }}
                    >
                      Xóa
                    </Button>
                  )}
                </div>
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
            placeholder="Nhập bình luận..."
            value={commentValue}
            onChange={val => setCommentValue(val)}
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
            autoSize={{ minRows: 3, maxRows: 6 }}
            prefix="@"
            notFoundContent={null}
            loading={commentLoading}
          />
          <Button
            type="primary"
            onClick={handleAddComment}
            loading={commentLoading}
            disabled={!commentValue.trim()}
            style={{ 
              marginTop: 8, 
              background: isDarkMode ? '#223355' : undefined, 
              color: isDarkMode ? '#fff' : undefined, 
              border: isDarkMode ? 'none' : undefined 
            }}
            block
          >
            Gửi bình luận
          </Button>
        </div>
      </Drawer>

      {/* Share Modal */}
      <Modal
        title="Chia sẻ dự án"
        open={shareModalOpen}
        onCancel={() => setShareModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={shareForm}
          layout="vertical"
          onFinish={handleShare}
        >
          <Form.Item
            name="email"
            label="Email người nhận"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input placeholder="Nhập email người nhận" />
          </Form.Item>
          <Form.Item
            name="message"
            label="Tin nhắn (tùy chọn)"
          >
            <TextArea rows={3} placeholder="Nhập tin nhắn..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Gửi chia sẻ
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ProjectCard; 