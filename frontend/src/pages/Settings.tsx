import React, { useEffect, useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Switch, 
  Typography, 
  message, 
  Divider, 
  Tabs, 
  Select, 
  Space, 
  Row, 
  Col,
  Checkbox,
  ColorPicker,
  InputNumber,
  Tag,
  Tooltip,
  Collapse
} from 'antd';
import { 
  SaveOutlined, 
  SettingOutlined, 
  FileTextOutlined, 
  ForkOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  TeamOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';

const { Title, Text } = Typography;
// Remove TabPane import as it's deprecated
const { Option } = Select;
const { Panel } = Collapse;

interface DocumentStatus {
  id: string;
  name: string;
  nameVi: string;
  color: string;
  isActive: boolean;
}

interface MetadataField {
  id: string;
  name: string;
  nameVi: string;
  isRequired: boolean;
  isActive: boolean;
}

interface ApprovalStep {
  id: string;
  name: string;
  nameVi: string;
  description: string;
  isAutomatic: boolean;
  isRequired: boolean;
  approverRole?: string;
  order: number;
}

interface FileNamingRule {
  template: string;
  example: string;
  isActive: boolean;
}

interface Permission {
  id: string;
  name: string;
  nameVi: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  nameVi: string;
  color: string;
}

interface PermissionMatrix {
  [permissionId: string]: {
    [roleId: string]: boolean;
  };
}

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [isoForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Permission Matrix State
  const [permissions, setPermissions] = useState<Permission[]>([
    { id: 'manage_users', name: 'Manage Users', nameVi: 'Quản lý người dùng', description: 'Thêm, sửa, xóa người dùng' },
    { id: 'manage_projects', name: 'Manage Projects', nameVi: 'Quản lý dự án', description: 'Tạo và quản lý dự án' },
    { id: 'manage_documents', name: 'Manage Documents', nameVi: 'Quản lý tài liệu', description: 'Upload, chỉnh sửa tài liệu' },
    { id: 'manage_tasks', name: 'Manage Tasks', nameVi: 'Quản lý nhiệm vụ', description: 'Tạo và phân công nhiệm vụ' },
    { id: 'manage_groups', name: 'Manage Groups', nameVi: 'Quản lý nhóm', description: 'Tạo và quản lý nhóm' },
    { id: 'system_settings', name: 'System Settings', nameVi: 'Cài đặt hệ thống', description: 'Cấu hình hệ thống' },
    { id: 'view_audit_log', name: 'View Audit Log', nameVi: 'Xem nhật ký audit', description: 'Xem lịch sử hoạt động' },
    { id: 'export_data', name: 'Export Data', nameVi: 'Xuất dữ liệu', description: 'Xuất báo cáo và dữ liệu' },
    { id: 'approve_documents', name: 'Approve Documents', nameVi: 'Phê duyệt tài liệu', description: 'Phê duyệt tài liệu' },
    { id: 'delete_data', name: 'Delete Data', nameVi: 'Xóa dữ liệu', description: 'Xóa tài liệu và dữ liệu' },
    { id: 'comment_documents', name: 'Comment Documents', nameVi: 'Bình luận tài liệu', description: 'Thêm bình luận vào tài liệu' },
    { id: 'upload_files', name: 'Upload Files', nameVi: 'Tải lên file', description: 'Upload tài liệu và file' },
    { id: 'edit_content', name: 'Edit Content', nameVi: 'Chỉnh sửa nội dung', description: 'Chỉnh sửa nội dung tài liệu' },
    { id: 'view_documents', name: 'View Documents', nameVi: 'Xem tài liệu', description: 'Xem và tải xuống tài liệu' },
    { id: 'view_projects', name: 'View Projects', nameVi: 'Xem dự án', description: 'Xem thông tin dự án' },
    { id: 'view_tasks', name: 'View Tasks', nameVi: 'Xem nhiệm vụ', description: 'Xem danh sách nhiệm vụ' }
  ]);

  const [roles, setRoles] = useState<Role[]>([
    { id: 'admin', name: 'Administrator', nameVi: 'Quản trị viên', color: 'red' },
    { id: 'project_manager', name: 'Project Manager', nameVi: 'Quản lý dự án', color: 'blue' },
    { id: 'editor', name: 'Editor', nameVi: 'Biên tập viên', color: 'green' },
    { id: 'approver', name: 'Approver', nameVi: 'Người phê duyệt', color: 'purple' },
    { id: 'viewer', name: 'Viewer', nameVi: 'Người xem', color: 'grey' }
  ]);

  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>({
    manage_users: { admin: true, project_manager: false, editor: false, approver: false, viewer: false },
    manage_projects: { admin: true, project_manager: true, editor: false, approver: false, viewer: false },
    manage_documents: { admin: true, project_manager: true, editor: true, approver: false, viewer: false },
    manage_tasks: { admin: true, project_manager: true, editor: true, approver: false, viewer: false },
    manage_groups: { admin: true, project_manager: false, editor: false, approver: false, viewer: false },
    system_settings: { admin: true, project_manager: false, editor: false, approver: false, viewer: false },
    view_audit_log: { admin: true, project_manager: false, editor: false, approver: false, viewer: false },
    export_data: { admin: true, project_manager: true, editor: false, approver: false, viewer: false },
    approve_documents: { admin: true, project_manager: false, editor: false, approver: true, viewer: false },
    delete_data: { admin: true, project_manager: false, editor: false, approver: false, viewer: false },
    comment_documents: { admin: true, project_manager: true, editor: true, approver: true, viewer: false },
    upload_files: { admin: true, project_manager: true, editor: true, approver: false, viewer: false },
    edit_content: { admin: true, project_manager: true, editor: true, approver: false, viewer: false },
    view_documents: { admin: true, project_manager: true, editor: true, approver: true, viewer: true },
    view_projects: { admin: true, project_manager: true, editor: true, approver: true, viewer: true },
    view_tasks: { admin: true, project_manager: true, editor: true, approver: true, viewer: true }
  });

  // ISO 19650 Configuration State
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>([
    { id: 'wip', name: 'WIP', nameVi: 'Đang thực hiện', color: '#faad14', isActive: true },
    { id: 'shared', name: 'Shared', nameVi: 'Đã chia sẻ', color: '#1890ff', isActive: true },
    { id: 'published', name: 'Published', nameVi: 'Đã xuất bản', color: '#52c41a', isActive: true },
    { id: 'archived', name: 'Archived', nameVi: 'Đã lưu trữ', color: '#8c8c8c', isActive: true }
  ]);

  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([
    { id: 'discipline', name: 'Discipline', nameVi: 'Chuyên ngành kỹ thuật', isRequired: true, isActive: true },
    { id: 'originator', name: 'Originator', nameVi: 'Tổ chức tạo tài liệu', isRequired: true, isActive: true },
    { id: 'zone', name: 'Zone/System', nameVi: 'Khu vực hoặc hệ thống', isRequired: false, isActive: true }
  ]);

  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([
    {
      id: 'create',
      name: 'Create Document',
      nameVi: 'Tạo tài liệu',
      description: 'Tài liệu được tạo với trạng thái WIP',
      isAutomatic: true,
      isRequired: true,
      order: 1
    },
    {
      id: 'internal-review',
      name: 'Internal Review',
      nameVi: 'Kiểm tra nội bộ',
      description: 'Kiểm tra chất lượng nội bộ trước khi chia sẻ',
      isAutomatic: false,
      isRequired: true,
      order: 2
    },
    {
      id: 'team-share',
      name: 'Share with Team',
      nameVi: 'Chia sẻ với team',
      description: 'Chuyển sang trạng thái Shared để team review',
      isAutomatic: false,
      isRequired: true,
      order: 3
    },
    {
      id: 'final-approval',
      name: 'Final Approval',
      nameVi: 'Phê duyệt cuối',
      description: 'Phê duyệt chính thức để Published',
      isAutomatic: false,
      isRequired: true,
      approverRole: 'Project Manager',
      order: 4
    }
  ]);

  const [fileNamingRule, setFileNamingRule] = useState<FileNamingRule>({
    template: '{Project}-{Originator}-{Zone}-{Level}-{Type}-{Role}-{Number}',
    example: 'ABC-XYZ-00-00-DR-A-001.pdf',
    isActive: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await axiosInstance.get('/auth/me');
        const userData = userRes.data as any;
        if (userData && typeof userData === 'object') {
          setUser(userData);
          form.setFieldsValue({ name: userData.name, email: userData.email });
        }

        // Fetch ISO configuration
        const isoRes = await axiosInstance.get('/settings/iso/config');
        const isoConfig = isoRes.data;
        
        if (isoConfig.documentStatuses) {
          setDocumentStatuses(isoConfig.documentStatuses);
        }
        if (isoConfig.metadataFields) {
          setMetadataFields(isoConfig.metadataFields);
        }
        if (isoConfig.approvalSteps) {
          setApprovalSteps(isoConfig.approvalSteps);
        }
        if (isoConfig.fileNamingRule) {
          setFileNamingRule(isoConfig.fileNamingRule);
        }

        // Fetch permission matrix
        const permRes = await axiosInstance.get('/settings/permissions-config');
        const permData = permRes.data;
        
        if (permData.permissions) {
          setPermissions(permData.permissions);
        }
        if (permData.roles) {
          setRoles(permData.roles);
        }
        if (permData.permissionMatrix) {
          setPermissionMatrix(permData.permissionMatrix);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [form]);

  const handleProfile = async (values: any) => {
    setLoading(true);
    try {
      await axiosInstance.put('/auth/me', values);
      message.success('Đã cập nhật thông tin cá nhân!');
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Lỗi cập nhật!');
    }
    setLoading(false);
  };

  const handlePassword = async (values: any) => {
    setLoading(true);
    try {
      await axiosInstance.post('/settings/change-password', values);
      message.success('Đổi mật khẩu thành công!');
      pwdForm.resetFields();
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Lỗi đổi mật khẩu!');
    }
    setLoading(false);
  };

  const handleISOSave = async () => {
    setLoading(true);
    try {
      // Save ISO 19650 configuration
      const isoConfig = {
        documentStatuses,
        metadataFields,
        approvalSteps,
        fileNamingRule
      };
      
      await axiosInstance.put('/settings/iso/config', isoConfig);
      
      message.success('Đã lưu cấu hình ISO 19650!');
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Lỗi lưu cấu hình!');
    }
    setLoading(false);
  };

  const handlePermissionMatrixSave = async () => {
    setLoading(true);
    try {
      await axiosInstance.put('/settings/permissions', {
        permissions,
        roles,
        permissionMatrix
      });
      message.success('Đã lưu ma trận phân quyền!');
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Lỗi lưu ma trận phân quyền!');
    }
    setLoading(false);
  };

  const updatePermissionMatrix = (permissionId: string, roleId: string, value: boolean) => {
    setPermissionMatrix(prev => ({
      ...prev,
      [permissionId]: {
        ...prev[permissionId],
        [roleId]: value
      }
    }));
  };

  const updateDocumentStatus = (id: string, field: keyof DocumentStatus, value: any) => {
    setDocumentStatuses(prev => 
      prev.map(status => 
        status.id === id ? { ...status, [field]: value } : status
      )
    );
  };

  const updateMetadataField = (id: string, field: keyof MetadataField, value: any) => {
    setMetadataFields(prev => 
      prev.map(field_item => 
        field_item.id === id ? { ...field_item, [field]: value } : field_item
      )
    );
  };

  const updateApprovalStep = (id: string, field: keyof ApprovalStep, value: any) => {
    setApprovalSteps(prev => 
      prev.map(step => 
        step.id === id ? { ...step, [field]: value } : step
      )
    );
  };

  const addMetadataField = () => {
    const newField: MetadataField = {
      id: `field_${Date.now()}`,
      name: 'New Field',
      nameVi: 'Trường mới',
      isRequired: false,
      isActive: true
    };
    setMetadataFields(prev => [...prev, newField]);
  };

  const removeMetadataField = (id: string) => {
    setMetadataFields(prev => prev.filter(field => field.id !== id));
  };

  const renderProfileTab = () => (
    <div>
      <Title level={4}>Thông tin cá nhân</Title>
      <Form form={form} layout="vertical" onFinish={handleProfile} style={{ marginBottom: 24 }}>
        <Form.Item name="name" label="Tên cá nhân" rules={[{ required: true, message: 'Nhập tên!' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Nhập email!' }]}>
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu thay đổi
          </Button>
        </Form.Item>
      </Form>
      
      <Divider />
      
      <Title level={4}>Đổi mật khẩu</Title>
      <Form form={pwdForm} layout="vertical" onFinish={handlePassword}>
        <Form.Item name="oldPassword" label="Mật khẩu cũ" rules={[{ required: true, message: 'Nhập mật khẩu cũ!' }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true, message: 'Nhập mật khẩu mới!' }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Đổi mật khẩu
          </Button>
        </Form.Item>
      </Form>
      
      <Divider />
      
      <Title level={4}>Giao diện</Title>
      <Form.Item name="theme" label="Chế độ giao diện" valuePropName="checked">
        <Switch checkedChildren="Tối" unCheckedChildren="Sáng" />
      </Form.Item>
    </div>
  );

  const renderISOTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4}>Quy Trình ISO 19650</Title>
          <Text type="secondary">
            Cấu hình workflow tự động và quy trình phê duyệt theo tiêu chuẩn ISO 19650
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          onClick={handleISOSave}
          loading={loading}
        >
          Lưu Thay Đổi
        </Button>
      </div>

      <Collapse defaultActiveKey={['document-status', 'metadata-fields', 'approval-process', 'file-naming']}>
        
        {/* Document Status Configuration */}
        <Panel header="Trạng Thái Tài Liệu" key="document-status">
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Cấu hình các trạng thái tài liệu theo ISO 19650
          </Text>
          
          {documentStatuses.map((status, index) => (
            <Card key={status.id} size="small" style={{ marginBottom: 12 }}>
              <Row gutter={16} align="middle">
                <Col span={6}>
                  <Input
                    value={status.name}
                    onChange={(e) => updateDocumentStatus(status.id, 'name', e.target.value)}
                    placeholder="Tên tiếng Anh"
                  />
                </Col>
                <Col span={6}>
                  <Input
                    value={status.nameVi}
                    onChange={(e) => updateDocumentStatus(status.id, 'nameVi', e.target.value)}
                    placeholder="Tên tiếng Việt"
                  />
                </Col>
                <Col span={4}>
                  <ColorPicker
                    value={status.color}
                    onChange={(color) => updateDocumentStatus(status.id, 'color', color.toHexString())}
                  />
                </Col>
                <Col span={4}>
                  <Tag color={status.color}>{status.nameVi}</Tag>
                </Col>
                <Col span={4}>
                  <Switch
                    checked={status.isActive}
                    onChange={(checked) => updateDocumentStatus(status.id, 'isActive', checked)}
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </Panel>

        {/* Metadata Fields Configuration */}
        <Panel header="Metadata Fields" key="metadata-fields">
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Cấu hình các trường metadata bắt buộc theo ISO 19650
          </Text>
          
          {metadataFields.map((field) => (
            <Card key={field.id} size="small" style={{ marginBottom: 12 }}>
              <Row gutter={16} align="middle">
                <Col span={6}>
                  <Input
                    value={field.name}
                    onChange={(e) => updateMetadataField(field.id, 'name', e.target.value)}
                    placeholder="Tên tiếng Anh"
                  />
                </Col>
                <Col span={6}>
                  <Input
                    value={field.nameVi}
                    onChange={(e) => updateMetadataField(field.id, 'nameVi', e.target.value)}
                    placeholder="Tên tiếng Việt"
                  />
                </Col>
                <Col span={4}>
                  <Checkbox
                    checked={field.isRequired}
                    onChange={(e) => updateMetadataField(field.id, 'isRequired', e.target.checked)}
                  >
                    Bắt buộc
                  </Checkbox>
                </Col>
                <Col span={4}>
                  <Switch
                    checked={field.isActive}
                    onChange={(checked) => updateMetadataField(field.id, 'isActive', checked)}
                  />
                </Col>
                <Col span={4}>
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => removeMetadataField(field.id)}
                  />
                </Col>
              </Row>
            </Card>
          ))}
          
          <Button 
            type="dashed" 
            icon={<PlusOutlined />} 
            onClick={addMetadataField}
            style={{ marginTop: 12 }}
          >
            Thêm Field Mới
          </Button>
        </Panel>

        {/* Approval Process Configuration */}
        <Panel header="Quy Trình Phê Duyệt" key="approval-process">
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Cấu hình quy trình phê duyệt tự động theo ISO 19650
          </Text>
          
          {approvalSteps.map((step) => (
            <Card key={step.id} size="small" style={{ marginBottom: 12 }}>
              <Row gutter={16} align="middle">
                <Col span={2}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    backgroundColor: '#1890ff', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 'bold'
                  }}>
                    {step.order}
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <Text strong>{step.nameVi}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {step.description}
                    </Text>
                  </div>
                </Col>
                <Col span={4}>
                  <Switch
                    checked={step.isAutomatic}
                    onChange={(checked) => updateApprovalStep(step.id, 'isAutomatic', checked)}
                  />
                  <Text style={{ marginLeft: 8, fontSize: 12 }}>
                    {step.isAutomatic ? 'Tự động' : 'Thủ công'}
                  </Text>
                </Col>
                <Col span={4}>
                  <Checkbox
                    checked={step.isRequired}
                    onChange={(e) => updateApprovalStep(step.id, 'isRequired', e.target.checked)}
                  >
                    Bắt buộc
                  </Checkbox>
                </Col>
                <Col span={6}>
                  {step.id === 'final-approval' && (
                    <Select
                      value={step.approverRole}
                      onChange={(value) => updateApprovalStep(step.id, 'approverRole', value)}
                      placeholder="Chọn vai trò"
                      style={{ width: '100%' }}
                    >
                      <Option value="Project Manager">Project Manager</Option>
                      <Option value="Technical Lead">Technical Lead</Option>
                      <Option value="Quality Manager">Quality Manager</Option>
                    </Select>
                  )}
                </Col>
              </Row>
            </Card>
          ))}
        </Panel>

        {/* File Naming Rules */}
        <Panel header="Quy Tắc Đặt Tên File" key="file-naming">
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Cấu hình quy tắc đặt tên file theo ISO 19650
          </Text>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Template">
                <Input
                  value={fileNamingRule.template}
                  onChange={(e) => setFileNamingRule(prev => ({ ...prev, template: e.target.value }))}
                  placeholder="{Project}-{Originator}-{Zone}-{Level}-{Type}-{Role}-{Number}"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ví dụ">
                <Input
                  value={fileNamingRule.example}
                  onChange={(e) => setFileNamingRule(prev => ({ ...prev, example: e.target.value }))}
                  placeholder="ABC-XYZ-00-00-DR-A-001.pdf"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item>
            <Switch
              checked={fileNamingRule.isActive}
              onChange={(checked) => setFileNamingRule(prev => ({ ...prev, isActive: checked }))}
            />
            <Text style={{ marginLeft: 8 }}>Kích hoạt quy tắc đặt tên</Text>
          </Form.Item>
        </Panel>
      </Collapse>
    </div>
  );

  const renderPermissionMatrixTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4}>Ma Trận Phân Quyền</Title>
          <Text type="secondary">Xem và quản lý quyền hạn của từng vai trò</Text>
        </div>
        <Button type="primary" icon={<SaveOutlined />} onClick={handlePermissionMatrixSave} loading={loading}>
          Lưu Thay Đổi
        </Button>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', minWidth: '200px', fontWeight: 600 }}>
                  QUYỀN HẠN
                </th>
                {roles.map(role => (
                  <th key={role.id} style={{ padding: '12px', textAlign: 'center', minWidth: '120px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: role.color === 'red' ? '#ff4d4f' : 
                                       role.color === 'blue' ? '#1890ff' : 
                                       role.color === 'green' ? '#52c41a' : 
                                       role.color === 'purple' ? '#722ed1' : '#8c8c8c',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        marginBottom: '4px'
                      }}>
                        {role.nameVi.charAt(0)}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>{role.nameVi}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map(permission => (
                <tr key={permission.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px', verticalAlign: 'top' }}>
                    <div>
                      <Text strong>{permission.nameVi}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>{permission.description}</Text>
                    </div>
                  </td>
                  {roles.map(role => (
                    <td key={role.id} style={{ padding: '12px', textAlign: 'center' }}>
                      <Checkbox
                        checked={permissionMatrix[permission.id]?.[role.id] || false}
                        onChange={(e) => updatePermissionMatrix(permission.id, role.id, e.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 20px' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <SettingOutlined style={{ fontSize: 24, marginRight: 12, color: '#1890ff' }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>Cài Đặt</Title>
            <Text type="secondary">Quản lý thông tin cá nhân và cấu hình hệ thống</Text>
          </div>
        </div>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'profile',
              label: (
                <span>
                  <FileTextOutlined />
                  Hồ sơ cá nhân
                </span>
              ),
              children: renderProfileTab()
            },
            {
              key: 'iso',
              label: (
                <span>
                  <ForkOutlined />
                  Quy trình ISO
                </span>
              ),
              children: renderISOTab()
            },
            {
              key: 'permissions',
              label: (
                <span>
                  <TeamOutlined />
                  Quản lý phân quyền
                </span>
              ),
              children: renderPermissionMatrixTab()
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default Settings; 