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
  Upload, 
  message,
  Tooltip,
  Badge,
  Divider,
  Typography,
  Drawer,
  List,
  Avatar,
  Steps,
  Alert
} from 'antd';
import { 
  UploadOutlined, 
  SettingOutlined, 
  RobotOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  FileTextOutlined,
  FolderOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SendOutlined,
  PauseCircleOutlined,
  UndoOutlined,
  UserSwitchOutlined,
  EyeOutlined,
  CommentOutlined,
  BarChartOutlined,
  QuestionCircleOutlined,
  MinusOutlined,
  DownloadOutlined,
  ZoomInOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  PlayCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  RightOutlined,
  LeftOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import ISOMetadataForm from '../components/ISOMetadataForm';
import ISOStatusBadge from '../components/ISOStatusBadge';
import DocumentMetadata from '../components/DocumentMetadata';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

interface Document {
  id: string;
  name: string;
  originalName: string;
  description: string;
  status: string;
  version: string;
  filePath: string;
  uploader: string;
  uploadDate: string;
  fileSize: string;
  metadata: any;
  projectId: string;
  projectName: string;
}

interface Project {
  id: string;
  name: string;
  status?: string;
  priority?: string;
  documents: Document[];
}

const DocumentsISO: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [commentDocument, setCommentDocument] = useState<Document | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentValue, setCommentValue] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [automationDrawerOpen, setAutomationDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // Mock data for demonstration
  const mockDocuments: Document[] = [
    {
      id: '1',
      name: 'BaoCaoKhaoSat_v1_50.pdf',
      originalName: 'Báo cáo khảo sát địa chất.pdf',
      description: 'Báo cáo khảo sát địa chất công trình',
      status: 'wip',
      version: 'v1',
      filePath: '/Du_An_X/WIP/ST/2024-06-15/BaoCaoKhaoSat_v1_50.pdf',
      uploader: 'Nguyễn Văn A',
      uploadDate: '15:30 15/06/2024',
      fileSize: '2.5 MB',
      metadata: {
        discipline: 'ST',
        originator: 'Công ty TNHH ABC',
        zone: 'Khu A',
        level: '50',
        type: 'SK',
        role: 'A',
        number: '001'
      },
      projectId: '1',
      projectName: 'Dự án X'
    },
    {
      id: '2',
      name: 'BanVeKienTruc_v2_30.dwg',
      originalName: 'Bản vẽ kiến trúc mặt bằng.dwg',
      description: 'Bản vẽ kiến trúc mặt bằng tầng 1',
      status: 'shared',
      version: 'v2',
      filePath: '/Du_An_X/Shared/AR/2024-06-15/BanVeKienTruc_v2_30.dwg',
      uploader: 'Trần Thị B',
      uploadDate: '14:20 15/06/2024',
      fileSize: '5.2 MB',
      metadata: {
        discipline: 'AR',
        originator: 'Công ty TNHH XYZ',
        zone: 'Khu B',
        level: '30',
        type: 'DR',
        role: 'A',
        number: '002'
      },
      projectId: '1',
      projectName: 'Dự án X'
    },
    {
      id: '3',
      name: 'TinhToanKetCau_v1_40.pdf',
      originalName: 'Tính toán kết cấu.pdf',
      description: 'Tính toán kết cấu móng cọc',
      status: 'published',
      version: 'v1',
      filePath: '/Du_An_X/Published/ST/2024-06-15/TinhToanKetCau_v1_40.pdf',
      uploader: 'Nguyễn Văn C',
      uploadDate: '13:15 15/06/2024',
      fileSize: '3.8 MB',
      metadata: {
        discipline: 'ST',
        originator: 'Công ty TNHH ABC',
        zone: 'Khu A',
        level: '40',
        type: 'CA',
        role: 'A',
        number: '003'
      },
      projectId: '1',
      projectName: 'Dự án X'
    },
    {
      id: '4',
      name: 'HopDongThiCong_v1_00.pdf',
      originalName: 'Hợp đồng thi công.pdf',
      description: 'Hợp đồng thi công phần móng',
      status: 'archived',
      version: 'v1',
      filePath: '/Du_An_X/Archived/PM/2024-06-15/HopDongThiCong_v1_00.pdf',
      uploader: 'Nguyễn Văn D',
      uploadDate: '12:00 15/06/2024',
      fileSize: '1.2 MB',
      metadata: {
        discipline: 'PM',
        originator: 'Công ty TNHH ABC',
        zone: 'Toàn bộ',
        level: '00',
        type: 'CO',
        role: 'A',
        number: '004'
      },
      projectId: '1',
      projectName: 'Dự án X'
    },
    {
      id: '5',
      name: 'BaoCaoNghiemThu_v1_50.pdf',
      originalName: 'Báo cáo nghiệm thu.pdf',
      description: 'Báo cáo nghiệm thu phần móng',
      status: 'wip',
      version: 'v1',
      filePath: '/Du_An_X/WIP/QS/2024-06-15/BaoCaoNghiemThu_v1_50.pdf',
      uploader: 'Nguyễn Văn E',
      uploadDate: '11:45 15/06/2024',
      fileSize: '4.1 MB',
      metadata: {
        discipline: 'QS',
        originator: 'Công ty TNHH ABC',
        zone: 'Khu A',
        level: '50',
        type: 'RP',
        role: 'A',
        number: '005'
      },
      projectId: '1',
      projectName: 'Dự án X'
    }
  ];

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/documents/iso', {
        params: {
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          discipline: selectedDiscipline === 'all' ? undefined : selectedDiscipline,
          projectId: selectedProject === 'all' ? undefined : selectedProject,
          search: searchText || undefined
        }
      });
      setDocuments(response.data.documents || mockDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Fallback to mock data
      setDocuments(mockDocuments);
    }
    setLoading(false);
  };

  const fetchProjects = async () => {
    try {
      const response = await axiosInstance.get('/projects');
      const projectsData = response.data.projects || response.data;
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Mock projects data
      setProjects([
        {
          id: '1',
          name: 'Dự án X',
          documents: mockDocuments.filter(doc => doc.projectId === '1')
        }
      ]);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, [selectedStatus, selectedDiscipline, selectedProject, searchText]);

  // Nhóm documents theo project
  const groupedDocuments = projects.map(project => ({
    key: project.id,
    project,
    documents: documents.filter(doc => doc.projectId === project.id),
  })).filter(g => g.documents.length > 0);

  const getStatusCount = (status: string) => {
    if (status === 'all') return documents.length;
    return documents.filter(doc => doc.status === status).length;
  };

  const getFilteredDocuments = () => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           doc.description.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
      const matchesDiscipline = selectedDiscipline === 'all' || doc.metadata?.discipline === selectedDiscipline;
      const matchesProject = selectedProject === 'all' || doc.projectId === selectedProject;
      
      return matchesSearch && matchesStatus && matchesDiscipline && matchesProject;
    });
  };

  // Sắp xếp dự án theo trạng thái và mức độ ưu tiên (như bên thẻ dự án)
  const getSortedProjects = () => {
    const statusOrder = {
      'ACTIVE': 1,      // Đang thực hiện
      'PLANNING': 2,    // Đang lên kế hoạch
      'ON_HOLD': 3,     // Đang tạm dừng
      'COMPLETED': 4,   // Hoàn thành
      'ARCHIVED': 5     // Lưu trữ
    };

    return projects.sort((a, b) => {
      const statusA = statusOrder[a.status as keyof typeof statusOrder] || 999;
      const statusB = statusOrder[b.status as keyof typeof statusOrder] || 999;
      
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      
      // Nếu cùng trạng thái, sắp xếp theo mức độ ưu tiên (chỉ áp dụng cho ACTIVE)
      if (a.status === 'ACTIVE' && b.status === 'ACTIVE') {
        const priorityOrder = {
          'HIGH': 1,        // Cao
          'MEDIUM': 2,      // Trung bình
          'LOW': 3          // Thấp
        };
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 999;
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 999;
        return priorityA - priorityB;
      }
      
      // Các trạng thái khác sắp xếp theo tên dự án
      return a.name.localeCompare(b.name);
    });
  };

  // Sắp xếp documents trong 1 dự án theo ưu tiên từ cao tới thấp
  const getSortedDocumentsForProject = (projectId: string) => {
    const projectDocuments = documents.filter(d => d.projectId === projectId);
    const priorityOrder = {
      'published': 1,
      'shared': 2,
      'wip': 3,
      'archived': 4
    };

    return projectDocuments.sort((a, b) => {
      const priorityA = priorityOrder[a.status as keyof typeof priorityOrder] || 999;
      const priorityB = priorityOrder[b.status as keyof typeof priorityOrder] || 999;
      return priorityA - priorityB;
    });
  };

  // Thao tác cho từng file
  const getDocumentActions = (document: Document) => {
    return [
      {
        icon: <ZoomInOutlined />,
        tooltip: 'Xem trước',
        key: 'preview',
        onClick: () => handlePreview(document)
      },
      {
        icon: <SendOutlined />,
        tooltip: 'Chuyển tiếp giai đoạn',
        key: 'nextStage',
        onClick: () => handleNextStage(document)
      },
      {
        icon: <CommentOutlined />,
        tooltip: 'Bình luận',
        key: 'comment',
        onClick: () => handleComment(document)
      },
      {
        icon: <DownloadOutlined />,
        tooltip: 'Tải về',
        key: 'download',
        onClick: () => handleDownload(document)
      }
    ];
  };

  const handlePreview = (document: Document) => {
    setPreviewDocument(document);
    setPreviewModalVisible(true);
  };

  const handleNextStage = (document: Document) => {
    const stages = ['wip', 'shared', 'published', 'archived'];
    const currentIndex = stages.indexOf(document.status);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      message.success(`Đã chuyển ${document.name} sang giai đoạn ${nextStage}`);
      // TODO: Call API to update document status
    } else {
      message.info('Tài liệu đã ở giai đoạn cuối cùng');
    }
  };

  const handleComment = (document: Document) => {
    setCommentDocument(document);
    setCommentDrawerOpen(true);
    // TODO: Fetch comments for this document
  };

  const handleDownload = (document: Document) => {
    message.success(`Đang tải về ${document.name}`);
    // TODO: Implement download functionality
  };

  const handleISOSettings = () => {
    // Navigate to settings page with ISO tab
    navigate('/settings?tab=iso');
  };

  const handleAutomation = () => {
    setAutomationDrawerOpen(true);
  };

  const handleUpload = async (values: any) => {
    setUploading(true);
    try {
      if (fileList.length === 0) {
        message.error('Vui lòng chọn tài liệu!');
        return;
      }

      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj);
      formData.append('name', fileList[0].name);
      formData.append('description', values.description || fileList[0].name);
      formData.append('projectId', values.projectId || '1');
      formData.append('metadata', JSON.stringify(values.metadata || {}));

      const response = await axiosInstance.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('Tài liệu đã được tải lên thành công!');
      setUploadModalVisible(false);
      uploadForm.resetFields();
      setFileList([]);
      
      // Refresh documents list
      fetchDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(error.response?.data?.error || 'Lỗi khi tải lên tài liệu!');
    }
    setUploading(false);
  };

  // 1. Table cha chỉ hiển thị tên dự án
  const parentColumns = [
    {
      title: '',
      dataIndex: 'project',
      key: 'project',
      render: (_: any, record: any) => (
        <span style={{ fontWeight: 600, fontSize: 16 }}>
          <Tag color="blue" style={{ fontSize: 15 }}>{record.project?.name || 'Dự án'}</Tag>
        </span>
      )
    }
  ];

  // 2. Table con: không có cột dự án, cột tên tài liệu rộng hơn
  const childColumns = [
    {
      title: 'Tài liệu',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
      render: (text: string, record: Document) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileTextOutlined style={{ color: '#1890ff', fontSize: 16 }} />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              <ISOStatusBadge status={record.status} />
              <span style={{ marginLeft: 8 }}>v{record.version}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: '20%',
      render: (text: string, record: Document) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            <Text type="secondary">Tên gốc: {record.originalName}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Metadata ISO 19650',
      key: 'metadata',
      width: '20%',
      render: (record: Document) => (
        <DocumentMetadata metadata={record.metadata} showTitle={false} compact={true} />
      ),
    },
    {
      title: 'Người tải lên',
      dataIndex: 'uploader',
      key: 'uploader',
      width: '12%',
      render: (text: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Ngày tải lên',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      width: '12%',
      render: (text: string) => (
        <Space>
          <CalendarOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Kích thước',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: '8%',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: '15%',
      render: (record: Document) => (
        <Space size="small">
          {getDocumentActions(record).map((action, index) => (
            <Tooltip key={index} title={action.tooltip}>
              <Button 
                type="text" 
                size="small" 
                icon={action.icon}
                onClick={action.onClick}
              />
            </Tooltip>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Quản Lý Tài Liệu CDE</Title>
          <Text type="secondary">Common Data Environment theo chuẩn ISO 19650</Text>
        </div>
        <Space>
          <Button type="primary" icon={<RobotOutlined />} onClick={handleAutomation}>
            Tự Động Hóa
          </Button>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
            Tải Lên
          </Button>
          <Button icon={<SettingOutlined />} onClick={handleISOSettings}>
            Cài Đặt CDE
          </Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng Dự Án"
              value={projects.length}
              prefix={<FolderOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng Tài Liệu"
              value={documents.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang Xử Lý"
              value={getStatusCount('wip')}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã Phê Duyệt"
              value={getStatusCount('published')}
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
              placeholder="Tìm kiếm tài liệu..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={16}>
            <Space>
              <Button 
                type={selectedStatus === 'all' ? 'primary' : 'default'}
                onClick={() => setSelectedStatus('all')}
              >
                Tất cả ({getStatusCount('all')})
              </Button>
              <Button 
                type={selectedStatus === 'wip' ? 'primary' : 'default'}
                onClick={() => setSelectedStatus('wip')}
              >
                WIP ({getStatusCount('wip')})
              </Button>
              <Button 
                type={selectedStatus === 'shared' ? 'primary' : 'default'}
                onClick={() => setSelectedStatus('shared')}
              >
                Shared ({getStatusCount('shared')})
              </Button>
              <Button 
                type={selectedStatus === 'published' ? 'primary' : 'default'}
                onClick={() => setSelectedStatus('published')}
              >
                Published ({getStatusCount('published')})
              </Button>
              <Button 
                type={selectedStatus === 'archived' ? 'primary' : 'default'}
                onClick={() => setSelectedStatus('archived')}
              >
                Archived ({getStatusCount('archived')})
              </Button>
              
              <Select
                value={selectedDiscipline}
                onChange={setSelectedDiscipline}
                style={{ width: 150 }}
                placeholder="Tất cả chuyên ngành"
              >
                <Option value="all">Tất cả chuyên ngành</Option>
                <Option value="AR">Kiến trúc</Option>
                <Option value="ST">Kết cấu</Option>
                <Option value="ME">Cơ điện</Option>
                <Option value="QS">Định giá</Option>
                <Option value="PM">Quản lý dự án</Option>
              </Select>
              
              <Select
                value={selectedProject}
                onChange={setSelectedProject}
                style={{ width: 150 }}
                placeholder="Tất cả dự án"
              >
                <Option value="all">Tất cả dự án</Option>
                {projects.map(project => (
                  <Option key={project.id} value={project.id}>
                    {project.name}
                  </Option>
                ))}
              </Select>
              
              <Button icon={<ClearOutlined />} onClick={() => {
                setSearchText('');
                setSelectedStatus('all');
                setSelectedDiscipline('all');
                setSelectedProject('all');
              }}>
                Xóa bộ lọc
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Document List - Grouped by Project */}
      <Card title={`Danh sách tài liệu (${getFilteredDocuments().length})`}>
        <Table
          columns={parentColumns}
          dataSource={getSortedProjects().map(project => ({
            key: project.id,
            project,
            documents: getSortedDocumentsForProject(project.id),
          })).filter(g => g.documents.length > 0)}
          rowKey={record => (record && typeof record === 'object' && 'key' in record ? (record as any).key : undefined)}
          expandable={{
            expandedRowRender: (record) => (
              <Table
                columns={childColumns}
                dataSource={record.documents}
                rowKey={doc => (doc && typeof doc === 'object' && 'id' in doc ? (doc as any).id : undefined)}
                pagination={false}
                showHeader={true}
                bordered={false}
              />
            ),
            rowExpandable: record => record.documents.length > 0,
          }}
          pagination={false}
          showHeader={false}
          bordered
          style={{ marginTop: 24 }}
          locale={{ emptyText: 'Không có tài liệu nào' }}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Tải lên tài liệu theo ISO 19650"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={uploadForm}
          layout="vertical"
          onFinish={handleUpload}
        >
          <Form.Item
            name="file"
            label="Chọn tài liệu"
            rules={[{ required: true, message: 'Vui lòng chọn tài liệu!' }]}
          >
            <Upload
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Chọn tài liệu</Button>
            </Upload>
          </Form.Item>

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

          <Form.Item
            name="description"
            label="Mô tả tài liệu"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết về tài liệu..." />
          </Form.Item>

          <Divider />

          <ISOMetadataForm 
            form={uploadForm} 
            showTitle={true}
          />

          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setUploadModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={uploading}>
                Tải lên
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={`Xem trước: ${previewDocument?.name}`}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={() => handleDownload(previewDocument!)}>
            Tải về
          </Button>,
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {previewDocument && (
          <div>
            <Alert
              message="Xem trước tài liệu"
              description={`Đang xem trước: ${previewDocument.originalName}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div style={{ 
              height: 400, 
              border: '1px solid #d9d9d9', 
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f5f5f5'
            }}>
              <div style={{ textAlign: 'center' }}>
                <FileTextOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                <div style={{ marginTop: 16 }}>
                  <Text strong>{previewDocument.name}</Text>
                </div>
                <div style={{ marginTop: 8, color: '#666' }}>
                  <Text type="secondary">Kích thước: {previewDocument.fileSize}</Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Button type="primary" icon={<DownloadOutlined />}>
                    Tải về để xem
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Comment Drawer */}
      <Drawer
        title={`Bình luận cho: ${commentDocument?.name || ''}`}
        placement="right"
        width={400}
        onClose={() => setCommentDrawerOpen(false)}
        open={commentDrawerOpen}
        destroyOnClose
      >
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, minHeight: 200 }}>
          <List
            loading={commentLoading}
            dataSource={comments}
            locale={{ emptyText: 'Chưa có bình luận nào.' }}
            renderItem={(item: any) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={item.user?.name || 'Người dùng'}
                  description={item.content}
                />
                <div style={{ fontSize: 11, color: '#888' }}>
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </List.Item>
            )}
          />
        </div>
        <div style={{
          borderTop: '1px solid #f0f0f0',
          padding: 12,
          position: 'sticky',
          bottom: 0,
          background: '#fff'
        }}>
          <Input.TextArea
            rows={3}
            value={commentValue}
            onChange={e => setCommentValue(e.target.value)}
            placeholder="Nhập bình luận..."
          />
          <Button
            type="primary"
            onClick={() => {
              // TODO: Add comment functionality
              message.success('Đã thêm bình luận!');
              setCommentValue('');
            }}
            disabled={!commentValue.trim()}
            style={{ marginTop: 8 }}
            block
          >
            Gửi bình luận
          </Button>
        </div>
      </Drawer>

      {/* Automation Drawer */}
      <Drawer
        title="Thiết lập tự động hóa đặt tên file"
        placement="right"
        width={500}
        onClose={() => setAutomationDrawerOpen(false)}
        open={automationDrawerOpen}
      >
        <div style={{ padding: 16 }}>
          <Alert
            message="Quy tắc đặt tên file theo dự án"
            description="Thiết lập quy tắc tự động đặt tên file khi upload theo chuẩn ISO 19650"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Steps direction="vertical" current={1} style={{ marginBottom: 24 }}>
            <Step 
              title="Chọn dự án" 
              description="Chọn dự án để áp dụng quy tắc"
              icon={<FolderOutlined />}
            />
            <Step 
              title="Thiết lập quy tắc" 
              description="Định nghĩa format tên file"
              icon={<SettingOutlined />}
            />
            <Step 
              title="Áp dụng" 
              description="Lưu và áp dụng quy tắc"
              icon={<CheckCircleOutlined />}
            />
          </Steps>

          <Form layout="vertical">
            <Form.Item label="Dự án">
              <Select placeholder="Chọn dự án">
                {projects.map(project => (
                  <Option key={project.id} value={project.id}>
                    {project.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Format tên file">
              <Input 
                placeholder="Ví dụ: {ProjectCode}_{Discipline}_{Type}_{Level}_{Version}"
                defaultValue="{ProjectCode}_{Discipline}_{Type}_{Level}_{Version}"
              />
            </Form.Item>

            <Form.Item label="Mô tả">
              <Input.TextArea 
                rows={3}
                placeholder="Mô tả quy tắc đặt tên file..."
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary">
                  Lưu quy tắc
                </Button>
                <Button>
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </Drawer>
    </div>
  );
};

export default DocumentsISO; 