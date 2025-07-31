import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Typography, Card, Tabs, Button, Space, Tag, Descriptions, 
  Table, Modal, Form, Input, Select, Spin, Popconfirm, message,
  Timeline, Avatar, List, DatePicker
} from 'antd';
import { Comment } from '@ant-design/compatible';
import { 
  EditOutlined, DeleteOutlined, PlusOutlined, 
  UserOutlined, FileOutlined, SendOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { 
  fetchTaskById, updateTask, deleteTask, 
  addComment, addDocumentToTask, removeDocumentFromTask 
} from '../store/slices/taskSlice';
import { fetchDocuments } from '../store/slices/documentSlice';
import { RootState } from '../store';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const TaskDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentTask, isLoading, error } = useSelector((state: RootState) => state.tasks);
  const { documents } = useSelector((state: RootState) => state.documents);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isAddDocumentModalVisible, setIsAddDocumentModalVisible] = useState<boolean>(false);
  const [commentValue, setCommentValue] = useState<string>('');
  const [form] = Form.useForm();
  
  // Fetch task data
  useEffect(() => {
    if (id) {
      dispatch(fetchTaskById(id) as any);
    }
  }, [dispatch, id]);
  
  // Set form values when task data is loaded
  useEffect(() => {
    if (currentTask) {
      form.setFieldsValue({
        title: currentTask.title,
        description: currentTask.description,
        status: currentTask.status,
        priority: currentTask.priority,
        assigneeId: currentTask.assigneeId,
        dueDate: currentTask.dueDate ? dayjs(currentTask.dueDate) : undefined
      });
      
      // Fetch project documents for document selection
      if (currentTask.projectId) {
        dispatch(fetchDocuments(currentTask.projectId) as any);
      }
    }
  }, [currentTask, form, dispatch]);
  
  if (isLoading) {
    return <Spin size="large" />;
  }
  
  if (error) {
    return <div>{error}</div>;
  }
  
  if (!currentTask) {
    return <div>{t('tasks.notFound')}</div>;
  }
  
  // Handle task update
  const handleUpdateTask = async (values: any) => {
    if (id) {
      // Format due date
      const formattedValues = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined
      };
      
      await dispatch(updateTask({ id, data: formattedValues }) as any);
      setIsEditModalVisible(false);
      message.success(t('tasks.updateSuccess'));
    }
  };
  
  // Handle task delete
  const handleDeleteTask = async () => {
    if (id) {
      await dispatch(deleteTask(id) as any);
      navigate('/tasks');
      message.success(t('tasks.deleteSuccess'));
    }
  };
  
  // Handle comment submit
  const handleCommentSubmit = async () => {
    if (commentValue.trim() && id) {
      await dispatch(addComment({ taskId: id, content: commentValue.trim() }) as any);
      setCommentValue('');
      message.success(t('tasks.commentAdded'));
    }
  };
  
  // Handle add document to task
  const handleAddDocument = async (values: { documentId: string }) => {
    if (id) {
      await dispatch(addDocumentToTask({ taskId: id, documentId: values.documentId }) as any);
      setIsAddDocumentModalVisible(false);
      message.success(t('tasks.documentAdded'));
    }
  };
  
  // Handle remove document from task
  const handleRemoveDocument = async (documentId: string) => {
    if (id) {
      await dispatch(removeDocumentFromTask({ taskId: id, documentId }) as any);
      message.success(t('tasks.documentRemoved'));
    }
  };
  
  // Task status tag color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'default';
      case 'IN_PROGRESS':
        return 'processing';
      case 'REVIEW':
        return 'warning';
      case 'DONE':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Task priority tag color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'blue';
      case 'MEDIUM':
        return 'orange';
      case 'HIGH':
        return 'red';
      default:
        return 'default';
    }
  };
  
  // Tab items
  const items: TabsProps['items'] = [
    {
      key: 'overview',
      label: t('tasks.tabs.overview'),
      children: (
        <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}>
          <Descriptions.Item label={t('tasks.title')}>{currentTask.title}</Descriptions.Item>
          <Descriptions.Item label={t('tasks.status')}>
            <Tag color={getStatusColor(currentTask.status)}>{currentTask.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('tasks.priority')}>
            <Tag color={getPriorityColor(currentTask.priority)}>{currentTask.priority}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('tasks.assignee')}>
            {currentTask.assignee?.name || t('tasks.unassigned')}
          </Descriptions.Item>
          <Descriptions.Item label={t('tasks.dueDate')}>
            {currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString() : t('tasks.noDueDate')}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.createdBy')}>
            {currentTask.createdBy?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.createdAt')}>
            {new Date(currentTask.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.updatedAt')}>
            {new Date(currentTask.updatedAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label={t('tasks.description')} span={4}>
            {currentTask.description || t('common.noDescription')}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'documents',
      label: t('tasks.tabs.documents'),
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setIsAddDocumentModalVisible(true)}
            >
              {t('tasks.addDocument')}
            </Button>
          </div>
          <Table 
            dataSource={currentTask.documents} 
            rowKey="id"
            columns={[
              {
                title: t('documents.name'),
                dataIndex: ['document', 'name'],
                key: 'name',
              },
              {
                title: t('documents.version'),
                dataIndex: ['document', 'version'],
                key: 'version',
                render: (version) => `v${version}`,
              },
              {
                title: t('documents.fileType'),
                dataIndex: ['document', 'fileType'],
                key: 'fileType',
              },
              {
                title: t('common.actions'),
                key: 'actions',
                render: (_, record) => (
                  <Space>
                    <Button 
                      size="small" 
                      icon={<FileOutlined />}
                      onClick={() => navigate(`/documents/${record.documentId}`)}
                    />
                    <Popconfirm
                      title={t('tasks.confirmRemoveDocument')}
                      onConfirm={() => handleRemoveDocument(record.documentId)}
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
      key: 'comments',
      label: t('tasks.tabs.comments'),
      children: (
        <>
          <List
            className="comment-list"
            itemLayout="horizontal"
            dataSource={currentTask.comments || []}
            renderItem={(comment) => (
              <li>
                <Comment
                  author={comment.user?.name}
                  avatar={<Avatar icon={<UserOutlined />} />}
                  content={<p>{comment.content}</p>}
                  datetime={new Date(comment.createdAt).toLocaleString()}
                />
              </li>
            )}
          />
          <div style={{ marginTop: 16 }}>
            <TextArea 
              rows={4} 
              value={commentValue}
              onChange={(e) => setCommentValue(e.target.value)}
              placeholder={t('tasks.addComment')}
              style={{ marginBottom: 8 }}
            />
            <Button 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={handleCommentSubmit}
              disabled={!commentValue.trim()}
            >
              {t('common.send')}
            </Button>
          </div>
        </>
      ),
    },
    {
      key: 'history',
      label: t('tasks.tabs.history'),
      children: (
        <Timeline
          mode="left"
          items={
            currentTask.history?.map((h) => ({
              label: new Date(h.createdAt).toLocaleString(),
              children: (
                <div>
                  <Paragraph>
                    <Text strong>{h.user?.name || '-'}</Text>
                  </Paragraph>
                  <Paragraph>
                    <Text>{h.action}: {h.details}</Text>
                  </Paragraph>
                </div>
              ),
              dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />
            })) || []
          }
        />
      ),
    },
  ];
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>{currentTask.title}</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => setIsEditModalVisible(true)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('tasks.confirmDelete')}
            onConfirm={handleDeleteTask}
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
      
      {/* Edit Task Modal */}
      <Modal
        title={t('tasks.edit')}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateTask}
        >
          <Form.Item
            name="title"
            label={t('tasks.title')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label={t('tasks.description')}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="status"
            label={t('tasks.status')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Select>
              <Option value="TODO">{t('tasks.status.todo')}</Option>
              <Option value="IN_PROGRESS">{t('tasks.status.inProgress')}</Option>
              <Option value="REVIEW">{t('tasks.status.review')}</Option>
              <Option value="DONE">{t('tasks.status.done')}</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="priority"
            label={t('tasks.priority')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Select>
              <Option value="LOW">{t('tasks.priority.low')}</Option>
              <Option value="MEDIUM">{t('tasks.priority.medium')}</Option>
              <Option value="HIGH">{t('tasks.priority.high')}</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="assigneeId"
            label={t('tasks.assignee')}
          >
            <Select allowClear placeholder={t('tasks.selectAssignee')}>
              {/* User options would be populated from API */}
            </Select>
          </Form.Item>
          <Form.Item
            name="dueDate"
            label={t('tasks.dueDate')}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {t('common.save')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Add Document Modal */}
      <Modal
        title={t('tasks.addDocument')}
        open={isAddDocumentModalVisible}
        onCancel={() => setIsAddDocumentModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleAddDocument}
        >
          <Form.Item
            name="documentId"
            label={t('documents.select')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Select placeholder={t('documents.select')}>
              {documents.map(doc => (
                <Option key={doc.id} value={doc.id}>{doc.name} (v{doc.version})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {t('common.add')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskDetail; 