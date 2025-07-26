import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, message, Card, List, Upload, Space, Popconfirm, Drawer, Typography, Row, Col, Tag, Radio, Tabs } from 'antd';
import axiosInstance from '../axiosConfig';
import moment from 'moment';
import { PlusOutlined, UploadOutlined, CalendarOutlined, TeamOutlined, FileOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title } = Typography;
const { TabPane } = Tabs;

// Định nghĩa các mức độ ưu tiên
const priorityLevels = [
  { value: 'HIGH', label: 'Cao', color: 'red' },
  { value: 'MEDIUM', label: 'Trung bình', color: 'orange' },
  { value: 'LOW', label: 'Thấp', color: 'green' },
  { value: 'NONE', label: 'Không', color: 'default' }
];

const Project: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [form] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [noteForm] = Form.useForm();
  const [imgLoading, setImgLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);

  // Hàm định nghĩa giá trị sắp xếp cho các trạng thái
  const getStatusSortValue = (status: string): number => {
    switch (status) {
      case 'ACTIVE': return 1;
      case 'ON_HOLD': return 2;
      case 'COMPLETED': return 3;
      case 'CANCELLED': return 4;
      default: return 5;
    }
  };
  
  // Hàm định nghĩa giá trị sắp xếp cho các mức độ ưu tiên (giảm dần)
  const getPrioritySortValue = (priority: string): number => {
    switch (priority) {
      case 'URGENT': return 1;
      case 'HIGH': return 2;
      case 'MEDIUM': return 3;
      case 'LOW': return 4;
      default: return 5;
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      console.log('Fetching projects...');
      const res = await axiosInstance.get('/projects');
      console.log('Projects data response:', res.data);
      
      // Kiểm tra dữ liệu trả về
      let projectsData = [];
      if (res.data && Array.isArray(res.data)) {
        projectsData = res.data;
      } else if (res.data && res.data.projects && Array.isArray(res.data.projects)) {
        projectsData = res.data.projects;
      } else {
        console.warn('Unexpected projects data format:', res.data);
      }
      
      // Xử lý dữ liệu để đảm bảo các trường hiển thị đúng
      const processedProjects = projectsData.map((project: any) => {
        console.log('Raw project data:', project);
        
        // Kiểm tra chi tiết và log các trường quan trọng
        console.log('Project fields check:', {
          id: project.id,
          name: project.name,
          description: project.description !== undefined ? `has value: ${project.description?.substring(0, 20)}` : 'undefined',
          startDate: project.startDate || 'not set',
          endDate: project.endDate || 'not set',
          priority: project.priority || 'not set',
          status: project.status,
          members: Array.isArray(project.members) ? `${project.members.length} members` : 'no members array'
        });
        
        // Xử lý các trường ngày tháng cẩn thận hơn
        let startDate = null;
        if (project.startDate) {
          try {
            // Kiểm tra kỹ kiểu dữ liệu
            if (typeof project.startDate === 'string') {
              // Kiểm tra chuỗi rỗng
              if (project.startDate.trim()) {
                const momentDate = moment(project.startDate);
                if (momentDate.isValid()) {
                  startDate = project.startDate;
                  console.log('Valid startDate:', startDate);
                } else {
                  console.warn('Invalid startDate string:', project.startDate);
                }
              } else {
                console.warn('Empty startDate string');
              }
            } else if (project.startDate instanceof Date) {
              startDate = project.startDate;
              console.log('Valid startDate Date object:', startDate);
            } else {
              console.warn('Unknown startDate format:', project.startDate);
            }
          } catch (error) {
            console.error('Error processing startDate:', error, project.startDate);
          }
        } else {
          console.log('No startDate provided');
        }
        
        let endDate = null;
        if (project.endDate) {
          try {
            // Kiểm tra kỹ kiểu dữ liệu
            if (typeof project.endDate === 'string') {
              // Kiểm tra chuỗi rỗng
              if (project.endDate.trim()) {
                const momentDate = moment(project.endDate);
                if (momentDate.isValid()) {
                  endDate = project.endDate;
                  console.log('Valid endDate:', endDate);
                } else {
                  console.warn('Invalid endDate string:', project.endDate);
                }
              } else {
                console.warn('Empty endDate string');
              }
            } else if (project.endDate instanceof Date) {
              endDate = project.endDate;
              console.log('Valid endDate Date object:', endDate);
            } else {
              console.warn('Unknown endDate format:', project.endDate);
            }
          } catch (error) {
            console.error('Error processing endDate:', error, project.endDate);
          }
        } else {
          console.log('No endDate provided');
        }
        
        // Xử lý priority
        let priority = project.priority || 'MEDIUM';
        
        // Nếu chưa có priority nhưng có deadline, tính toán mức độ ưu tiên dựa trên thời gian còn lại
        if (!project.priority && project.status === 'ACTIVE' && endDate) {
          const daysToEnd = moment(endDate).diff(moment(), 'days');
          
          // Nếu còn ít hơn 30 ngày đến deadline
          if (daysToEnd <= 30) {
            priority = 'HIGH';
          } 
          // Nếu còn ít hơn 90 ngày đến deadline
          else if (daysToEnd <= 90) {
            priority = 'MEDIUM';
          } 
          // Nếu còn nhiều hơn 90 ngày
          else {
            priority = 'LOW';
          }
        }
        
        // Đảm bảo các trường quan trọng luôn có giá trị
        const processedProject = {
          ...project,
          description: typeof project.description === 'string' ? project.description : '',
          startDate: startDate,
          endDate: endDate,
          priority: priority,
          members: Array.isArray(project.members) ? project.members : []
        };
        
        console.log('Processed project:', processedProject);
        return processedProject;
      });
      
      // Sắp xếp dự án theo trạng thái và mức độ ưu tiên
      processedProjects.sort((a: { status: string; priority: string }, b: { status: string; priority: string }) => {
        // Sắp xếp trước tiên theo trạng thái
        const statusComparison = getStatusSortValue(a.status) - getStatusSortValue(b.status);
        if (statusComparison !== 0) return statusComparison;
        
        // Nếu cùng trạng thái, sắp xếp theo mức độ ưu tiên (giảm dần)
        return getPrioritySortValue(a.priority) - getPrioritySortValue(b.priority);
      });
      
      console.log('Processed and sorted projects:', processedProjects);
      setProjects(processedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      message.error('Không thể tải danh sách dự án!');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/users');
      console.log('Users data response:', res.data);
      
      // Kiểm tra dữ liệu trả về
      if (res.data && Array.isArray(res.data)) {
        setUsers(res.data);
      } else if (res.data && res.data.users && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      } else {
        console.warn('Unexpected users data format:', res.data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Không thể tải danh sách người dùng!');
      setUsers([]);
    }
  };
  useEffect(() => { fetchProjects(); fetchUsers(); }, []);

  const handleAdd = () => {
    console.log('Adding new project...');
    setEditingProject(null);
    form.setFieldsValue({
      name: '',
      description: '',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      startDate: null,
      endDate: null,
      memberIds: []
    });
    setModalOpen(true);
  };
  const handleEdit = (record: any) => {
    console.log('Editing project:', record);
    setEditingProject(record);
    
    // Xử lý ngày tháng
    const startDate = record.startDate ? moment(record.startDate) : null;
    const endDate = record.endDate ? moment(record.endDate) : null;
    
    // Xử lý danh sách thành viên
    let memberIds = [];
    if (record.members && Array.isArray(record.members)) {
      memberIds = record.members.map((member: any) => {
        if (member.userId) return member.userId;
        if (member.id) return member.id;
        return member;
      }).filter(Boolean);
    }
    
    console.log('Setting form values:', {
      ...record,
      startDate,
      endDate,
      memberIds
    });
    
    form.setFieldsValue({
      name: record.name || '',
      description: record.description || '',
      status: record.status || 'ACTIVE',
      startDate,
      endDate,
      memberIds
    });
    
    setModalOpen(true);
  };
  const handleOk = async () => {
    try {
      // Thêm giá trị mặc định cho form trước khi validate
      const currentValues = form.getFieldsValue();
      form.setFieldsValue({
        name: currentValues.name || '',
        description: currentValues.description || '',
        status: currentValues.status || 'ACTIVE',
        priority: currentValues.priority || 'MEDIUM',
        startDate: currentValues.startDate || null,
        endDate: currentValues.endDate || null,
        memberIds: currentValues.memberIds || []
      });
      
      // Validate form
      const values = await form.validateFields();
      console.log('DEBUG FORM VALUES:', values);
      
      // Kiểm tra và xử lý các trường bắt buộc
      if (!values.name || typeof values.name !== 'string' || values.name.trim().length < 3) {
        message.error('Tên dự án phải có ít nhất 3 ký tự và không được để trống!');
        return;
      }
      
      // Định dạng ngày tháng
      const formattedValues = {
        ...values,
        name: values.name?.trim(),
        description: values.description?.trim() || '',
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
        priority: values.priority || 'MEDIUM',
        memberIds: values.memberIds || []
      };
      
      console.log('Sending project data:', formattedValues);
      
      if (editingProject) {
        const response = await axiosInstance.put(`/projects/${editingProject.id}`, formattedValues);
        console.log('Project update response:', response.data);
        message.success('Đã cập nhật dự án');
      } else {
        const response = await axiosInstance.post('/projects', formattedValues);
        console.log('Project create response:', response.data);
        message.success('Đã tạo dự án');
      }
      setModalOpen(false);
      fetchProjects();
    } catch (e: any) {
      console.error('LỖI SUBMIT FORM:', e);
      console.error('Error details:', e.response?.data || e);
      
      // Log chi tiết hơn về lỗi
      if (e.errorFields) {
        console.log('Form validation errors:', e.errorFields);
        e.errorFields.forEach((field: any, index: number) => {
          console.log(`Field ${index + 1}:`, field.name, 'Errors:', field.errors);
        });
      }
      
      if (e.response) {
        console.log('Server response status:', e.response.status);
        console.log('Server response data:', e.response.data);
      }
      
      // Nếu là lỗi validate của antd form
      if (e && e.errorFields && Array.isArray(e.errorFields) && e.errorFields.length > 0) {
        message.error(e.errorFields[0].errors[0] || 'Vui lòng kiểm tra lại thông tin!');
      } else {
        message.error(e?.response?.data?.error || e?.message || 'Đã xảy ra lỗi!');
      }
    }
  };
  const handleDelete = async (id: string) => {
    try {
      console.log('Deleting project with ID:', id);
      const response = await axiosInstance.delete(`/projects/${id}`);
      console.log('Delete response:', response.data);
      message.success('Đã xóa dự án');
      fetchProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      console.error('Error response:', error.response?.data);
      message.error('Không thể xóa dự án. ' + (error.response?.data?.error || error.message));
    }
  };
  const showDetail = async (record: any) => {
    try {
      console.log('Fetching project details for ID:', record.id);
      const res = await axiosInstance.get(`/projects/${record.id}`);
      console.log('Project detail response:', res.data);
      
      // Xử lý dữ liệu trước khi hiển thị
      const projectData = res.data;
      
      // Chuyển đổi định dạng ngày tháng
      let startDate = null;
      let endDate = null;
      
      if (projectData.startDate) {
        try {
          startDate = moment(projectData.startDate).isValid() ? 
            moment(projectData.startDate) : null;
        } catch (e) {
          console.error('Error parsing startDate:', e);
        }
      }
      
      if (projectData.endDate) {
        try {
          endDate = moment(projectData.endDate).isValid() ? 
            moment(projectData.endDate) : null;
        } catch (e) {
          console.error('Error parsing endDate:', e);
        }
      }
      
      // Đảm bảo các trường có giá trị mặc định
      const processedData = {
        ...projectData,
        name: projectData.name || '',
        description: projectData.description || '',
        status: projectData.status || 'ACTIVE',
        startDate: startDate,
        endDate: endDate,
        members: Array.isArray(projectData.members) ? projectData.members : [],
        documents: Array.isArray(projectData.documents) ? projectData.documents : [],
        tasks: Array.isArray(projectData.tasks) ? projectData.tasks : [],
        images: Array.isArray(projectData.images) ? projectData.images : [],
        notes: Array.isArray(projectData.notes) ? projectData.notes : []
      };
      
      console.log('Processed project data:', processedData);
      setDetail(processedData);
      setDrawerOpen(true);
    } catch (error: any) {
      console.error('Error fetching project details:', error);
      console.error('Error response:', error.response?.data);
      message.error('Không thể tải thông tin chi tiết dự án');
    }
  };
  const handleAddNote = async (values: any) => {
    await axiosInstance.post(`/projects/${detail.id}/note`, { ...values, authorId: users[0]?.id });
    message.success('Đã thêm ghi chú');
    noteForm.resetFields();
    showDetail(detail);
  };
  const handleUpload = async (info: any) => {
    if (info.file.status === 'uploading') { setImgLoading(true); return; }
    if (info.file.status === 'done') {
      setImgLoading(false);
      message.success('Đã upload ảnh');
      showDetail(detail);
    }
  };

  // Hàm lấy màu ưu tiên
  const getPriorityColor = (priority: string) => {
    const priorityItem = priorityLevels.find(p => p.value === priority);
    return priorityItem ? priorityItem.color : 'default';
  };

  // Hàm lấy tên ưu tiên
  const getPriorityLabel = (priority: string) => {
    const priorityItem = priorityLevels.find(p => p.value === priority);
    return priorityItem ? priorityItem.label : 'Không';
  };

  // Hàm lấy icon trạng thái
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
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  // Hàm lấy tên trạng thái
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

  // Hàm lọc dự án theo mức độ ưu tiên
  const filterProjectsByPriority = (projects: any[]) => {
    if (!priorityFilter) return projects;
    return projects.filter(project => project.priority === priorityFilter);
  };

  // Hàm lọc dự án dựa trên các bộ lọc
  const getFilteredProjects = () => {
    if (!projects || !Array.isArray(projects)) return [];
    
    return projects.filter(project => {
      // Lọc theo ưu tiên
      if (priorityFilter && project.priority !== priorityFilter) {
        return false;
      }
      
      // Lọc theo trạng thái
      if (statusFilter && project.status !== statusFilter) {
        return false;
      }
      
      // Lọc theo từ khóa tìm kiếm (tên dự án hoặc mô tả)
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const nameMatch = project.name && project.name.toLowerCase().includes(searchLower);
        const descMatch = project.description && project.description.toLowerCase().includes(searchLower);
        
        if (!nameMatch && !descMatch) {
          return false;
        }
      }
      
      // Lọc theo khoảng thời gian
      if (dateRangeFilter[0] || dateRangeFilter[1]) {
        const startDate = dateRangeFilter[0];
        const endDate = dateRangeFilter[1];
        
        // Nếu có ngày bắt đầu lọc và dự án có ngày bắt đầu
        if (startDate && project.startDate) {
          const projectStartDate = moment(project.startDate);
          if (projectStartDate.isBefore(startDate)) {
            return false;
          }
        }
        
        // Nếu có ngày kết thúc lọc và dự án có ngày bắt đầu
        if (endDate && project.startDate) {
          const projectStartDate = moment(project.startDate);
          if (projectStartDate.isAfter(endDate)) {
            return false;
          }
        }
      }
      
      return true;
    });
  };

  // Hàm render cho trường Ngày bắt đầu 
  const renderDate = (date: any) => {
    // In giá trị date để debug
    console.log('renderDate input:', date, typeof date);
    
    // Nếu không có giá trị hoặc giá trị là null hoặc undefined
    if (date === null || date === undefined) {
      console.log('Date is null or undefined');
      return '-';
    }
    
    try {
      // Kiểm tra kỹ kiểu dữ liệu
      if (typeof date === 'string') {
        // Nếu là chuỗi rỗng
        if (!date.trim()) {
          console.log('Date is empty string');
          return '-';
        }
        
        const momentDate = moment(date);
        if (!momentDate.isValid()) {
          console.warn('Invalid date string:', date);
          return '-';
        }
        console.log('Valid string date, formatted as:', momentDate.format('DD/MM/YYYY'));
        return momentDate.format('DD/MM/YYYY');
      }
      
      // Nếu đã là đối tượng Date
      if (date instanceof Date) {
        const momentDate = moment(date);
        console.log('Date object, formatted as:', momentDate.format('DD/MM/YYYY'));
        return momentDate.format('DD/MM/YYYY');
      }
      
      // Các trường hợp khác
      console.warn('Unknown date format:', date);
      return '-';
    } catch (err) {
      console.error('Error formatting date:', err, date);
      return '-';
    }
  };

  const columns = [
    { 
      title: 'Tên dự án', 
      dataIndex: 'name', 
      key: 'name',
      render: (text: string) => text || '-'
    },
    { 
      title: 'Mô tả', 
      dataIndex: 'description', 
      key: 'description',
      render: (text: string) => text || '-'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag icon={getStatusIcon(status)} color={
          status === 'ACTIVE' ? 'blue' :
          status === 'COMPLETED' ? 'green' :
          status === 'ON_HOLD' ? 'gold' :
          status === 'CANCELLED' ? 'red' : 'default'
        }>
          {getStatusLabel(status)}
        </Tag>
      )
    },
    { 
      title: 'Ngày bắt đầu', 
      dataIndex: 'startDate', 
      key: 'startDate', 
      render: renderDate
    },
    { 
      title: 'Ngày kết thúc', 
      dataIndex: 'endDate', 
      key: 'endDate', 
      render: renderDate
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityLabel(priority)}
        </Tag>
      )
    },
    { 
      title: 'Thành viên', 
      dataIndex: 'members', 
      key: 'members', 
      render: (ms: any[]) => {
        if (!ms || !Array.isArray(ms) || ms.length === 0) return '-';
        return ms.map(m => m.user?.name || m.name || '').filter(Boolean).join(', ') || '-';
      }
    },
    {
      title: 'Hành động', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => showDetail(record)}>Chi tiết</Button>
          <Button type="link" onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm 
            title="Xóa dự án này?" 
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Hàm render dự án dạng card
  const renderProjectCard = (project: any) => {
    // Xác định màu sắc cho card dựa vào priority
    const getPriorityColor = (priority: string) => {
      const priorityInfo = priorityLevels.find(p => p.value === priority);
      return priorityInfo ? priorityInfo.color : 'default';
    };
    
    // Xác định icon cho trạng thái
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
    
    // Xác định text cho trạng thái
    const getStatusText = (status: string) => {
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
    
    return (
      <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Tag 
            style={{ 
              position: 'absolute',
              top: '-10px',
              left: '16px',
              zIndex: 1
            }}
            icon={getStatusIcon(project.status)} 
            color={
              project.status === 'ACTIVE' ? 'blue' :
              project.status === 'COMPLETED' ? 'green' :
              project.status === 'ON_HOLD' ? 'gold' :
              project.status === 'CANCELLED' ? 'red' : 'default'
            }
          >
            {getStatusLabel(project.status)}
          </Tag>
          <Card
            hoverable
            title={project.name}
            extra={
              <Tag color={getPriorityColor(project.priority)}>
                {priorityLevels.find(p => p.value === project.priority)?.label || 'Không'}
              </Tag>
            }
            actions={[
              <Button type="link" onClick={() => showDetail(project)} key="detail">Chi tiết</Button>,
              <Button type="link" onClick={() => handleEdit(project)} key="edit">Sửa</Button>,
              <Popconfirm
                title="Xóa dự án này?"
                onConfirm={() => handleDelete(project.id)}
                okText="Có"
                cancelText="Không"
                key="delete"
              >
                <Button type="link" danger>Xóa</Button>
              </Popconfirm>
            ]}
          >
            <div style={{ marginBottom: 8 }}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              <span>
                {project.startDate && moment(project.startDate).isValid() 
                  ? moment(project.startDate).format('DD/MM/YYYY') 
                  : '-'
                }
                {' → '}
                {project.endDate && moment(project.endDate).isValid() 
                  ? moment(project.endDate).format('DD/MM/YYYY') 
                  : '-'
                }
              </span>
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <TeamOutlined style={{ marginRight: 8 }} />
              <span>
                {project.members && Array.isArray(project.members) && project.members.length > 0
                  ? `${project.members.length} thành viên`
                  : 'Chưa có thành viên'
                }
              </span>
            </div>
            
            {project._count && (
              <div>
                <FileOutlined style={{ marginRight: 8 }} />
                <span>
                  {project._count.documents || 0} tài liệu, {project._count.tasks || 0} công việc
                </span>
              </div>
            )}
          </Card>
        </div>
      </Col>
    );
  };

  const renderProjectContent = (project: any) => {
    return (
      <div style={{ marginTop: '10px' }}>
        <div><strong>Mô tả:</strong> {project.description || '-'}</div>
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>Bắt đầu:</strong> {renderDate(project.startDate)}
          </div>
          <div>
            <strong>Kết thúc:</strong> {renderDate(project.endDate)}
          </div>
        </div>
      </div>
    );
  };
  
  // Hiển thị Card dự án cho chế độ Card
  const renderProjectCards = () => {
    return getFilteredProjects().map(project => (
      <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          {/* Hiển thị thẻ ưu tiên phía trên bên trái */}
          <Tag 
            style={{ 
              position: 'absolute',
              top: '-10px',
              left: '16px',
              zIndex: 1
            }}
            color={getPriorityColor(project.priority)}
          >
            {getPriorityLabel(project.priority)}
          </Tag>
          
          {/* Hiển thị thẻ trạng thái phía trên bên phải */}
          <Tag 
            style={{ 
              position: 'absolute',
              top: '-10px',
              right: '16px',
              zIndex: 1
            }}
            icon={getStatusIcon(project.status)} 
            color={
              project.status === 'ACTIVE' ? 'blue' :
              project.status === 'COMPLETED' ? 'green' :
              project.status === 'ON_HOLD' ? 'gold' :
              project.status === 'CANCELLED' ? 'red' : 'default'
            }
          >
            {getStatusLabel(project.status)}
          </Tag>
          
          <Card
            hoverable
            title={project.name}
            actions={[
              <Button type="link" onClick={() => showDetail(project)} key="detail">Chi tiết</Button>,
              <Button type="link" onClick={() => handleEdit(project)} key="edit">Sửa</Button>,
              <Popconfirm
                title="Xóa dự án này?"
                onConfirm={() => handleDelete(project.id)}
                okText="Có"
                cancelText="Không"
                key="delete"
              >
                <Button type="link" danger>Xóa</Button>
              </Popconfirm>
            ]}
          >
            <div style={{ marginBottom: 8 }}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              <span>
                {renderDate(project.startDate)}
                {' → '}
                {renderDate(project.endDate)}
              </span>
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <TeamOutlined style={{ marginRight: 8 }} />
              <span>
                {project.members && Array.isArray(project.members) && project.members.length > 0
                  ? `${project.members.length} thành viên`
                  : 'Chưa có thành viên'
                }
              </span>
            </div>
            
            {project._count && (
              <div>
                <FileOutlined style={{ marginRight: 8 }} />
                <span>
                  {project._count.documents || 0} tài liệu, {project._count.tasks || 0} công việc
                </span>
              </div>
            )}
            {renderProjectContent(project)}
          </Card>
        </div>
      </Col>
    ));
  };

  // Component hiển thị bộ lọc
  const renderFilters = () => {
    return (
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Radio.Group 
              value={viewMode} 
              onChange={e => setViewMode(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="table">Bảng</Radio.Button>
              <Radio.Button value="card">Thẻ</Radio.Button>
            </Radio.Group>
          </Col>
          <Col>
            <Input.Search
              placeholder="Tìm kiếm dự án"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </Col>
          <Col>
            <Button onClick={() => setFilterDrawerVisible(true)}>
              Bộ lọc nâng cao
            </Button>
          </Col>
          <Col>
            <Button 
              type="link" 
              onClick={() => {
                setPriorityFilter(null);
                setStatusFilter(null);
                setSearchText('');
                setDateRangeFilter([null, null]);
              }}
            >
              Xóa bộ lọc
            </Button>
          </Col>
        </Row>
      </div>
    );
  };

  // Component Drawer hiển thị bộ lọc nâng cao
  const renderFilterDrawer = () => {
    return (
      <Drawer
        title="Bộ lọc nâng cao"
        placement="right"
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        width={300}
      >
        <Form layout="vertical">
          <Form.Item label="Mức độ ưu tiên">
            <Select
              value={priorityFilter}
              onChange={value => setPriorityFilter(value)}
              placeholder="Chọn mức độ ưu tiên"
              allowClear
              style={{ width: '100%' }}
            >
              {priorityLevels.map(priority => (
                <Option key={priority.value} value={priority.value}>
                  <Tag color={priority.color}>{priority.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Trạng thái">
            <Select
              value={statusFilter}
              onChange={value => setStatusFilter(value)}
              placeholder="Chọn trạng thái"
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="ACTIVE">Đang hoạt động</Option>
              <Option value="COMPLETED">Hoàn thành</Option>
              <Option value="ON_HOLD">Tạm dừng</Option>
              <Option value="CANCELLED">Đã hủy</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Khoảng thời gian">
            <DatePicker.RangePicker
              value={dateRangeFilter as any}
              onChange={dates => setDateRangeFilter(dates as [moment.Moment | null, moment.Moment | null])}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              block
              onClick={() => setFilterDrawerVisible(false)}
            >
              Áp dụng
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Thêm dự án</Button>
        {renderFilters()}
      </div>
      
      {renderFilterDrawer()}
      
      {viewMode === 'table' ? (
        <Table 
          rowKey="id" 
          columns={columns} 
          dataSource={getFilteredProjects()} 
          loading={loading} 
          bordered
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} dự án`,
            pageSizeOptions: ['10', '20', '50', '100'],
            defaultPageSize: 10
          }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {renderProjectCards()}
        </Row>
      )}
      
      <Modal open={modalOpen} title={editingProject ? 'Sửa dự án' : 'Thêm dự án'} onOk={handleOk} onCancel={() => setModalOpen(false)}>
        <Form 
          form={form} 
          layout="vertical"
          initialValues={{
            status: 'ACTIVE',
            description: '',
            memberIds: []
          }}
        >
          <Form.Item
            name="name"
            label="Tên dự án"
            rules={[
              { required: true, whitespace: true, message: 'Nhập tên dự án!' },
              { min: 3, message: 'Tên dự án phải có ít nhất 3 ký tự!' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả"> <Input.TextArea /> </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Chọn trạng thái!' }]}>
            <Select>
              <Select.Option value="ACTIVE">Đang hoạt động</Select.Option>
              <Select.Option value="COMPLETED">Hoàn thành</Select.Option>
              <Select.Option value="ON_HOLD">Tạm dừng</Select.Option>
              <Select.Option value="CANCELLED">Đã hủy</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Mức độ ưu tiên">
            <Select placeholder="Chọn mức độ ưu tiên">
              {priorityLevels.map(priority => (
                <Option key={priority.value} value={priority.value}>
                  <Tag color={priority.color}>{priority.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="startDate" label="Ngày bắt đầu"> <DatePicker style={{ width: '100%' }} /> </Form.Item>
          <Form.Item name="endDate" label="Ngày kết thúc"> <DatePicker style={{ width: '100%' }} /> </Form.Item>
          <Form.Item name="memberIds" label="Thành viên"> <Select mode="multiple" options={users.map((u: any) => ({ value: u.id, label: u.name }))} /> </Form.Item>
        </Form>
      </Modal>
      
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width={700} title={detail?.name || 'Chi tiết dự án'}>
        {detail && (
          <div>
            <Title level={4}>Thông tin dự án</Title>
            <p><b>Tên dự án:</b> {detail.name || '-'}</p>
            <p><b>Mô tả:</b> {detail.description || '-'}</p>
            <p><b>Trạng thái:</b> {detail.status ? (
              detail.status === 'ACTIVE' ? 'Đang hoạt động' :
              detail.status === 'COMPLETED' ? 'Hoàn thành' :
              detail.status === 'ON_HOLD' ? 'Tạm dừng' :
              detail.status === 'CANCELLED' ? 'Đã hủy' : detail.status
            ) : '-'}</p>
            <p><b>Mức độ ưu tiên:</b> {detail.priority ? (
              <Tag color={priorityLevels.find(p => p.value === detail.priority)?.color || 'default'}>
                {priorityLevels.find(p => p.value === detail.priority)?.label || 'Không'}
              </Tag>
            ) : '-'}</p>
            <p><b>Ngày bắt đầu:</b> {detail.startDate && moment(detail.startDate).isValid() ? moment(detail.startDate).format('DD/MM/YYYY') : '-'}</p>
            <p><b>Ngày kết thúc:</b> {detail.endDate && moment(detail.endDate).isValid() ? moment(detail.endDate).format('DD/MM/YYYY') : '-'}</p>
            <p><b>Thành viên:</b> {detail.members && Array.isArray(detail.members) && detail.members.length > 0 ? 
              detail.members.map((m: any) => m.user?.name || m.name || '').filter(Boolean).join(', ') : '-'}</p>
            
            <Tabs defaultActiveKey="documents">
              <TabPane tab="Tài liệu" key="documents">
                {detail.documents && Array.isArray(detail.documents) && detail.documents.length > 0 ? (
                  <List 
                    dataSource={detail.documents} 
                    renderItem={(doc: any) => (
                      <List.Item>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.name || 'Tài liệu'}</a>
                      </List.Item>
                    )} 
                  />
                ) : <p>Chưa có tài liệu</p>}
              </TabPane>
              
              <TabPane tab="Công việc" key="tasks">
                {detail.tasks && Array.isArray(detail.tasks) && detail.tasks.length > 0 ? (
                  <List 
                    dataSource={detail.tasks} 
                    renderItem={(task: any) => (
                      <List.Item>{task.title || 'Công việc'}</List.Item>
                    )} 
                  />
                ) : <p>Chưa có công việc</p>}
              </TabPane>
              
              <TabPane tab="Ảnh dự án" key="images">
                <Upload
                  action={`${axiosInstance.defaults.baseURL}/projects/${detail.id}/image`}
                  headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                  showUploadList={true}
                  onChange={handleUpload}
                  multiple={false}
                  withCredentials={true}
                  data={{ projectId: detail.id, uploadedById: users[0]?.id }}
                >
                  <Button icon={<UploadOutlined />} loading={imgLoading}>Upload ảnh</Button>
                </Upload>
                {detail.images && Array.isArray(detail.images) && detail.images.length > 0 ? (
                  <List 
                    grid={{ gutter: 8, column: 4 }} 
                    dataSource={detail.images} 
                    renderItem={(img: any) => (
                      <List.Item>
                        <img src={img.url} alt="project" style={{ width: '100%', borderRadius: 8 }} />
                      </List.Item>
                    )} 
                  />
                ) : <p style={{ marginTop: 8 }}>Chưa có ảnh</p>}
              </TabPane>
              
              <TabPane tab="Ghi chú" key="notes">
                <Form form={noteForm} layout="inline" onFinish={handleAddNote} style={{ marginBottom: 16 }}>
                  <Form.Item name="content" rules={[{ required: true, message: 'Nhập ghi chú!' }]}> 
                    <Input placeholder="Thêm ghi chú..." /> 
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">Thêm</Button>
                  </Form.Item>
                </Form>
                {detail.notes && Array.isArray(detail.notes) && detail.notes.length > 0 ? (
                  <List 
                    dataSource={detail.notes} 
                    renderItem={(note: any) => (
                      <List.Item>
                        {note.content || ''} 
                        <span style={{ color: '#888' }}>
                          ({note.author?.name || 'Người dùng'})
                        </span>
                      </List.Item>
                    )} 
                  />
                ) : <p>Chưa có ghi chú</p>}
              </TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Project; 