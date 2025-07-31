import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Typography, Card, Tabs, Button, Space, Tag, Descriptions, 
  Table, Modal, Form, Input, Select, Spin, Popconfirm, message,
  Upload, Timeline
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, DownloadOutlined, 
  UploadOutlined, FileOutlined, EyeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { fetchDocumentById, updateDocument, deleteDocument, uploadNewVersion } from '../store/slices/documentSlice';
import { RootState } from '../store';
import type { TabsProps, UploadProps } from 'antd';
import type { RcFile } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const DocumentDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentDocument, isLoading, error, uploadProgress } = useSelector((state: RootState) => state.documents);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState<boolean>(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  
  // Fetch document data
  useEffect(() => {
    if (id) {
      dispatch(fetchDocumentById(id) as any);
    }
  }, [dispatch, id]);
  
  // Set form values when document data is loaded
  useEffect(() => {
    if (currentDocument) {
      form.setFieldsValue({
        name: currentDocument.name,
        description: currentDocument.description,
        status: currentDocument.status
      });
    }
  }, [currentDocument, form]);
  
  if (isLoading) {
    return <Spin size="large" />;
  }
  
  if (error) {
    return <div>{error}</div>;
  }
  
  if (!currentDocument) {
    return <div>{t('documents.notFound')}</div>;
  }
  
  // Handle document update
  const handleUpdateDocument = async (values: any) => {
    if (id) {
      await dispatch(updateDocument({ id, data: values }) as any);
      setIsEditModalVisible(false);
      message.success(t('documents.updateSuccess'));
    }
  };
  
  // Handle document delete
  const handleDeleteDocument = async () => {
    if (id) {
      await dispatch(deleteDocument(id) as any);
      navigate('/documents');
      message.success(t('documents.deleteSuccess'));
    }
  };
  
  // Handle new version upload
  const handleUploadNewVersion = async () => {
    if (fileList.length === 0 || !id) return;
    
    const formData = new FormData();
    formData.append('file', fileList[0].originFileObj as RcFile);
    
    await dispatch(uploadNewVersion({ formData, documentId: id }) as any);
    setIsUploadModalVisible(false);
    setFileList([]);
    message.success(t('documents.versionSuccess'));
  };
  
  // Upload props
  const uploadProps: UploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      setFileList([file]);
      return false;
    },
    fileList,
    maxCount: 1
  };
  
  // Document status tag color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'IN_REVIEW':
        return 'processing';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Tab items
  const items: TabsProps['items'] = [
    {
      key: 'overview',
      label: t('documents.tabs.overview'),
      children: (
        <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}>
          <Descriptions.Item label={t('documents.name')}>{currentDocument.name}</Descriptions.Item>
          <Descriptions.Item label={t('documents.status')}>
            <Tag color={getStatusColor(currentDocument.status)}>{currentDocument.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('documents.version')}>v{currentDocument.version}</Descriptions.Item>
          <Descriptions.Item label={t('documents.fileType')}>{currentDocument.fileType}</Descriptions.Item>
          <Descriptions.Item label={t('documents.fileSize')}>
            {formatFileSize(currentDocument.fileSize)}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.createdBy')}>
            {currentDocument.createdBy?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.createdAt')}>
            {new Date(currentDocument.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.updatedAt')}>
            {new Date(currentDocument.updatedAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label={t('documents.description')} span={4}>
            {currentDocument.description || t('common.noDescription')}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'history',
      label: t('documents.tabs.history'),
      children: (
        <Timeline
          mode="left"
          items={
            currentDocument.history?.map((h) => ({
              label: `v${h.version} - ${new Date(h.createdAt).toLocaleString()}`,
              children: (
                <div>
                  <Paragraph>
                    <Text strong>{t('documents.version')}: {h.version}</Text>
                  </Paragraph>
                  <Paragraph>
                    <Text>{t('documents.fileType')}: {h.fileType}</Text>
                  </Paragraph>
                  <Paragraph>
                    <Text>{t('documents.fileSize')}: {formatFileSize(h.fileSize)}</Text>
                  </Paragraph>
                  <Paragraph>
                    <Text>{t('common.uploadedBy')}: {h.createdBy?.name || '-'}</Text>
                  </Paragraph>
                  <Space>
                    <Button 
                      size="small" 
                      icon={<DownloadOutlined />}
                      href={h.fileUrl}
                      target="_blank"
                    >
                      {t('common.download')}
                    </Button>
                  </Space>
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
        <Title level={2}>{currentDocument.name}</Title>
        <Space>
          <Button 
            icon={<EyeOutlined />}
            onClick={() => setIsPreviewModalVisible(true)}
          >
            {t('common.preview')}
          </Button>
          <Button 
            icon={<DownloadOutlined />}
            href={currentDocument.fileUrl}
            target="_blank"
          >
            {t('common.download')}
          </Button>
          <Button 
            icon={<UploadOutlined />}
            onClick={() => setIsUploadModalVisible(true)}
          >
            {t('documents.newVersion')}
          </Button>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => setIsEditModalVisible(true)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('documents.confirmDelete')}
            onConfirm={handleDeleteDocument}
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
      
      {/* Edit Document Modal */}
      <Modal
        title={t('documents.edit')}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateDocument}
        >
          <Form.Item
            name="name"
            label={t('documents.name')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label={t('documents.description')}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="status"
            label={t('documents.status')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Select>
              <Option value="DRAFT">{t('documents.status.draft')}</Option>
              <Option value="IN_REVIEW">{t('documents.status.inReview')}</Option>
              <Option value="APPROVED">{t('documents.status.approved')}</Option>
              <Option value="REJECTED">{t('documents.status.rejected')}</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {t('common.save')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Upload New Version Modal */}
      <Modal
        title={t('documents.newVersion')}
        open={isUploadModalVisible}
        onCancel={() => {
          setIsUploadModalVisible(false);
          setFileList([]);
        }}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleUploadNewVersion}>
          <Form.Item
            name="file"
            label={t('documents.selectFile')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>{t('documents.uploadFile')}</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              disabled={fileList.length === 0}
              loading={uploadProgress > 0 && uploadProgress < 100}
            >
              {t('common.upload')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Preview Modal */}
      <Modal
        title={`${currentDocument.name} (v${currentDocument.version})`}
        open={isPreviewModalVisible}
        onCancel={() => setIsPreviewModalVisible(false)}
        width="80%"
        footer={null}
      >
        {currentDocument.fileType.startsWith('image/') ? (
          <img 
            src={currentDocument.fileUrl} 
            alt={currentDocument.name} 
            style={{ maxWidth: '100%', maxHeight: '70vh' }} 
          />
        ) : currentDocument.fileType === 'application/pdf' ? (
          <iframe 
            src={`${currentDocument.fileUrl}#toolbar=0`} 
            width="100%" 
            height="70vh" 
            title={currentDocument.name}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <FileOutlined style={{ fontSize: 64 }} />
            <p>{t('documents.previewNotAvailable')}</p>
            <Button 
              icon={<DownloadOutlined />}
              href={currentDocument.fileUrl}
              target="_blank"
            >
              {t('common.download')}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentDetail; 