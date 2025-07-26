import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Typography, Card, Tabs, Button, Space, Tag, Descriptions, 
  Table, Modal, Form, Input, Select, Spin, Popconfirm, message, 
  DatePicker, List, Avatar, Upload
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, PlusOutlined, 
  UserAddOutlined, TeamOutlined, FileOutlined, 
  CommentOutlined, UploadOutlined
} from '@ant-design/icons';
import { fetchProjectById, updateProject, deleteProject } from '../store/slices/projectSlice';
import { RootState } from '../store';
import type { TabsProps } from 'antd';
import moment from 'moment';
import axiosInstance from '../axiosConfig';
import type { UploadProps } from 'antd';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const ProjectDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentProject, isLoading, error } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState<boolean>(false);
  const [isAddNoteModalVisible, setIsAddNoteModalVisible] = useState<boolean>(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [noteForm] = Form.useForm();
  
  // Add these state variables and functions
  const [isUploadModalVisible, setIsUploadModalVisible] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [projectImages, setProjectImages] = useState<any[]>([]);

  // Fetch project data
  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id) as any);
    }
  }, [dispatch, id]);
  
  // Fetch project images
  useEffect(() => {
    const fetchImages = async () => {
      if (id) {
        try {
          const response = await axiosInstance.get(`/projects/${id}/images`);
          if (Array.isArray(response.data)) {
            setProjectImages(response.data);
          } else {
            console.warn('Unexpected images data format:', response.data);
            setProjectImages([]);
          }
        } catch (error) {
          console.error('Error fetching images:', error);
          setProjectImages([]);
        }
      }
    };
    
    fetchImages();
  }, [id]);
  
  // Fetch project notes
  useEffect(() => {
    const fetchNotes = async () => {
      if (id) {
        try {
          console.log('Fetching notes for project:', id);
          const response = await axiosInstance.get(`/projects/${id}/notes`);
          console.log('Notes fetch response:', response.data);
          
          if (Array.isArray(response.data)) {
            setNotes(response.data);
          } else {
            console.warn('Unexpected notes data format:', response.data);
            setNotes([]);
          }
        } catch (error) {
          console.error('Error fetching notes:', error);
          // Mặc định nếu API gặp lỗi thì dùng dữ liệu mẫu
          setNotes([
            {
              id: '1',
              content: 'Ghi chú mẫu 1',
              createdAt: new Date().toISOString(),
              user: { name: 'Admin', id: '1' }
            },
            {
              id: '2',
              content: 'Ghi chú mẫu 2',
              createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              user: { name: 'Admin', id: '1' }
            }
          ]);
        }
      }
    };
    
    fetchNotes();
  }, [id]);
  
  // Set form values when project data is loaded
  useEffect(() => {
    if (currentProject) {
      form.setFieldsValue({
        name: currentProject.name,
        description: currentProject.description,
        status: currentProject.status,
        priority: currentProject.priority,
        startDate: currentProject.startDate ? moment(currentProject.startDate) : null,
        endDate: currentProject.endDate ? moment(currentProject.endDate) : null
      });
    }
  }, [currentProject, form]);
  
  if (isLoading) {
    return <Spin size="large" />;
  }
  
  if (error) {
    return <div>{error}</div>;
  }
  
  if (!currentProject) {
    return <div>{t('projects.notFound')}</div>;
  }
  
  // Handle project update
  const handleUpdateProject = async (values: any) => {
    if (id) {
      // Đảm bảo các giá trị mặc định
      const formattedValues = {
        ...values,
        name: values.name?.trim() || '',
        description: values.description?.trim() || '',
        status: values.status || 'ACTIVE',
        priority: values.priority || 'MEDIUM',
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null
      };
      
      console.log('Sending project update data:', formattedValues);
      await dispatch(updateProject({ id, data: formattedValues }) as any);
      setIsEditModalVisible(false);
      message.success(t('projects.updateSuccess'));
    }
  };

  // Helper function để hiển thị dữ liệu an toàn
  const safeRender = (value: any, defaultValue: string = t('common.notSet')): string => {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
      return defaultValue;
    }
    return value;
  };

  // Helper function để hiển thị ngày tháng
  const renderDate = (date: any): string => {
    if (!date) return t('common.notSet');
    try {
      return new Date(date).toLocaleDateString();
    } catch (e) {
      console.error('Error rendering date:', e);
      return t('common.notSet');
    }
  };
  
  // Handle project delete
  const handleDeleteProject = async () => {
    if (id) {
      await dispatch(deleteProject(id) as any);
      navigate('/projects');
      message.success(t('projects.deleteSuccess'));
    }
  };
  
  // Handle add note
  const handleAddNote = async () => {
    try {
      const values = await noteForm.validateFields();
      
      console.log('Adding note with data:', values);
      
      try {
        // Call the proper API endpoint
        const response = await axiosInstance.post(`/projects/${id}/notes`, {
          content: values.content
        });
        
        console.log('Note creation response:', response.data);
        
        // Update the notes list with the new note from the API response
        if (response.data) {
          setNotes([response.data, ...notes]);
        } else {
          // Fallback if API doesn't return the created note
          const newNote = {
            id: Date.now().toString(),
            content: values.content,
            createdAt: new Date().toISOString(),
            user: { name: user?.name || 'Unknown', id: user?.id || '0' }
          };
          setNotes([newNote, ...notes]);
        }
        
        noteForm.resetFields();
        setIsAddNoteModalVisible(false);
        message.success(t('notes.addSuccess'));
      } catch (error: any) {
        console.error('Error adding note:', error);
        console.error('Response data:', error.response?.data);
        message.error(error.response?.data?.error || t('notes.addError'));
      }
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };
  
  // Project status tag color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'COMPLETED':
        return 'blue';
      case 'ON_HOLD':
        return 'orange';
      case 'CANCELLED':
        return 'red';
      default:
        return 'default';
    }
  };
  
  // Member role tag color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'gold';
      case 'ADMIN':
        return 'red';
      case 'EDITOR':
        return 'green';
      case 'VIEWER':
        return 'blue';
      default:
        return 'default';
    }
  };

  // Project priority tag color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'red';
      case 'MEDIUM':
        return 'orange';
      case 'LOW':
        return 'blue';
      default:
        return 'default';
    }
  };
  
  // Define filesTab before using it
  const filesTab = {
    key: 'files',
    label: t('projects.tabs.files'),
    children: (
      <>
        <div style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            icon={<UploadOutlined />} 
            onClick={() => setIsUploadModalVisible(true)}
          >
            {t('uploads.uploadFiles')}
          </Button>
        </div>
        
        {projectImages && projectImages.length > 0 ? (
          <List
            grid={{ gutter: 16, column: 4 }}
            dataSource={projectImages}
            renderItem={(file: any) => (
              <List.Item key={file.id}>
                <Card
                  hoverable
                  cover={
                    <img 
                      alt={file.name || 'Project image'} 
                      src={file.url} 
                      style={{ height: 200, objectFit: 'cover' }}
                    />
                  }
                  actions={[
                    <a 
                      key="download" 
                      href={file.url} 
                      download 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {t('common.download')}
                    </a>
                  ]}
                >
                  <Card.Meta
                    title={file.name || 'Image'}
                    description={
                      <>
                        <div>{moment(file.createdAt).format('DD/MM/YYYY')}</div>
                        <div>{file.user?.name || 'Unknown user'}</div>
                      </>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>{t('uploads.noFiles')}</p>
          </div>
        )}
      </>
    ),
  };
  
  // Tab items
  const items: TabsProps['items'] = [
    {
      key: 'overview',
      label: t('projects.tabs.overview'),
      children: (
        <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}>
          <Descriptions.Item label={t('projects.name')}>{safeRender(currentProject.name)}</Descriptions.Item>
          <Descriptions.Item label={t('projects.status')}>
            <Tag color={getStatusColor(currentProject.status)}>{currentProject.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('projects.startDate')}>
            {renderDate(currentProject.startDate)}
          </Descriptions.Item>
          <Descriptions.Item label={t('projects.endDate')}>
            {renderDate(currentProject.endDate)}
          </Descriptions.Item>
          <Descriptions.Item label={t('projects.priority')}>
            {currentProject.priority ? 
              <Tag color={getPriorityColor(currentProject.priority)}>{currentProject.priority}</Tag> 
              : t('common.notSet')}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.createdAt')}>
            {renderDate(currentProject.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.updatedAt')}>
            {renderDate(currentProject.updatedAt)}
          </Descriptions.Item>
          <Descriptions.Item label={t('projects.description')} span={4}>
            {safeRender(currentProject.description, t('common.noDescription'))}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'members',
      label: t('projects.tabs.members'),
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<UserAddOutlined />} 
              onClick={() => setIsAddMemberModalVisible(true)}
            >
              {t('projects.addMember')}
            </Button>
          </div>
          <Table 
            dataSource={currentProject.members} 
            rowKey="id"
            columns={[
              {
                title: t('users.name'),
                dataIndex: ['user', 'name'],
                key: 'name',
              },
              {
                title: t('users.email'),
                dataIndex: ['user', 'email'],
                key: 'email',
              },
              {
                title: t('projects.role'),
                dataIndex: 'role',
                key: 'role',
                render: (role) => <Tag color={getRoleColor(role)}>{role}</Tag>,
              },
              {
                title: t('common.actions'),
                key: 'actions',
                render: (_, record) => (
                  <Space>
                    <Button size="small" icon={<EditOutlined />} />
                    <Popconfirm
                      title={t('projects.confirmRemoveMember')}
                      onConfirm={() => {}}
                      okText={t('common.yes')}
                      cancelText={t('common.no')}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </>
      ),
    },
    {
      key: 'containers',
      label: t('projects.tabs.containers'),
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />}>
              {t('containers.create')}
            </Button>
          </div>
          <Table 
            dataSource={currentProject.containers} 
            rowKey="id"
            columns={[
              {
                title: t('containers.name'),
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: t('containers.status'),
                dataIndex: 'status',
                key: 'status',
                render: (status) => {
                  let color = 'default';
                  if (status === 'WIP') color = 'processing';
                  if (status === 'SHARED') color = 'warning';
                  if (status === 'PUBLISHED') color = 'success';
                  if (status === 'ARCHIVED') color = 'default';
                  
                  return <Tag color={color}>{status}</Tag>;
                },
              },
              {
                title: t('documents.count'),
                dataIndex: 'documentCount',
                key: 'documentCount',
                render: (count) => count || 0,
              },
              {
                title: t('common.createdAt'),
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (date) => new Date(date).toLocaleDateString(),
              },
              {
                title: t('common.actions'),
                key: 'actions',
                render: (_, record) => (
                  <Space>
                    <Button 
                      size="small" 
                      icon={<FileOutlined />}
                      onClick={() => navigate(`/documents?containerId=${record.id}`)}
                    />
                    <Button size="small" icon={<EditOutlined />} />
                    <Popconfirm
                      title={t('containers.confirmDelete')}
                      onConfirm={() => {}}
                      okText={t('common.yes')}
                      cancelText={t('common.no')}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </>
      ),
    },
    {
      key: 'notes',
      label: t('projects.tabs.notes'),
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<CommentOutlined />} 
              onClick={() => setIsAddNoteModalVisible(true)}
            >
              {t('notes.addNote')}
            </Button>
          </div>
          <List
            dataSource={notes}
            renderItem={(note: any) => (
              <List.Item
                key={note.id}
                actions={[
                  <span key="date">
                    {note.createdAt ? moment(note.createdAt).fromNow() : '-'}
                  </span>,
                  <span key="user">
                    {note.user?.name || 'Unknown'}
                  </span>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar>
                      {note.user?.name ? note.user.name.charAt(0) : '?'}
                    </Avatar>
                  }
                  title={note.user?.name || 'Unknown'}
                  description={note.content || ''}
                />
              </List.Item>
            )}
            locale={{ emptyText: t('notes.noNotes') }}
          />
        </>
      ),
    },
    filesTab, // Add the new files tab
  ];
  
  // Handle file upload
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error(t('common.noFileSelected'));
      return;
    }
    
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('projectId', id as string);
    
    setUploading(true);
    
    try {
      console.log('Uploading files:', fileList);
      const response = await axiosInstance.post(`/projects/${id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', response.data);
      
      // Refresh the image list by fetching the latest images
      try {
        const imagesResponse = await axiosInstance.get(`/projects/${id}/images`);
        if (Array.isArray(imagesResponse.data)) {
          setProjectImages(imagesResponse.data);
        }
      } catch (imgError) {
        console.error('Error refreshing images:', imgError);
      }
      
      message.success(t('uploads.success'));
      setFileList([]);
      setIsUploadModalVisible(false);
    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(error.response?.data?.error || t('uploads.error'));
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([...fileList, file]);
      return false;
    },
    fileList,
  };
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>{currentProject.name}</Title>
        <Space>
          <Tag color={getPriorityColor(currentProject.priority || 'MEDIUM')}>
            {currentProject.priority || t('common.notSet')}
          </Tag>
          <Tag color={getStatusColor(currentProject.status)}>
            {currentProject.status}
          </Tag>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => setIsEditModalVisible(true)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('projects.confirmDelete')}
            onConfirm={handleDeleteProject}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      </div>
      
      <Card>
        <Tabs defaultActiveKey="overview" items={items} />
      </Card>
      
      {/* Edit Project Modal */}
      <Modal
        title={t('projects.edit')}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProject}
        >
          <Form.Item
            name="name"
            label={t('projects.name')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label={t('projects.description')}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="status"
            label={t('projects.status')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Select>
              <Option value="ACTIVE">{t('projects.status.active')}</Option>
              <Option value="COMPLETED">{t('projects.status.completed')}</Option>
              <Option value="ON_HOLD">{t('projects.status.onHold')}</Option>
              <Option value="CANCELLED">{t('projects.status.cancelled')}</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="priority"
            label={t('projects.priority')}
          >
            <Select>
              <Option value="LOW">{t('projects.priority.low')}</Option>
              <Option value="MEDIUM">{t('projects.priority.medium')}</Option>
              <Option value="HIGH">{t('projects.priority.high')}</Option>
              <Option value="URGENT">{t('projects.priority.urgent')}</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="startDate"
            label={t('projects.startDate')}
          >
            <DatePicker 
              format="DD/MM/YYYY" 
              style={{ width: '100%' }}
              popupStyle={{ zIndex: 1060 }}
              getPopupContainer={(trigger) => trigger.parentElement as HTMLElement}
            />
          </Form.Item>
          <Form.Item
            name="endDate"
            label={t('projects.endDate')}
          >
            <DatePicker 
              format="DD/MM/YYYY" 
              style={{ width: '100%' }}
              popupStyle={{ zIndex: 1060 }}
              getPopupContainer={(trigger) => trigger.parentElement as HTMLElement}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {t('common.save')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Add Member Modal */}
      <Modal
        title={t('projects.addMember')}
        open={isAddMemberModalVisible}
        onCancel={() => setIsAddMemberModalVisible(false)}
        footer={null}
      >
        <Form
          form={memberForm}
          layout="vertical"
          onFinish={() => {}}
        >
          <Form.Item
            name="userId"
            label={t('users.select')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Select placeholder={t('users.select')}>
              {/* User options would be populated from API */}
            </Select>
          </Form.Item>
          <Form.Item
            name="role"
            label={t('projects.role')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Select>
              <Option value="ADMIN">{t('roles.admin')}</Option>
              <Option value="EDITOR">{t('roles.editor')}</Option>
              <Option value="VIEWER">{t('roles.viewer')}</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {t('common.add')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        title={t('notes.addNote')}
        open={isAddNoteModalVisible}
        onCancel={() => setIsAddNoteModalVisible(false)}
        footer={null}
      >
        <Form
          form={noteForm}
          layout="vertical"
          onFinish={handleAddNote}
        >
          <Form.Item
            name="content"
            label={t('notes.content')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {t('common.add')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Upload Files Modal */}
      <Modal
        title={t('uploads.uploadFiles')}
        open={isUploadModalVisible}
        onCancel={() => setIsUploadModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsUploadModalVisible(false)}>
            {t('common.cancel')}
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleUpload}
            loading={uploading}
            disabled={fileList.length === 0}
          >
            {t('common.upload')}
          </Button>,
        ]}
      >
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />}>{t('common.selectFile')}</Button>
        </Upload>
      </Modal>
    </div>
  );
};

export default ProjectDetail; 