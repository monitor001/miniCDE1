import React, { useEffect, useState } from 'react';
import { Calendar, Badge, Select, Spin, Modal, List, Button, Tag, Table, Drawer, Form, Input, DatePicker, Switch, message, Popconfirm, Tabs, Row, Col, Card, Avatar, Typography, Space, Tooltip, Statistic, Empty, Alert, theme } from 'antd';
import axiosInstance from '../axiosConfig';
import dayjs, { Dayjs } from 'dayjs';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers as fetchUsersThunk } from '../store/slices/userSlice';
import { RootState } from '../store';
import io from 'socket.io-client';
import { message as antdMessage } from 'antd';
import { 
  CalendarOutlined, 
  TeamOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  ProjectOutlined,
  BellOutlined,
  FileTextOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const eventTypeColors: Record<string, string> = {
  MEETING: '#1890ff',
  DEADLINE: '#ff4d4f',
  MILESTONE: '#faad14',
  EVENT: '#52c41a',
};

const eventTypeIcons: Record<string, any> = {
  MEETING: TeamOutlined,
  DEADLINE: ExclamationCircleOutlined,
  MILESTONE: CheckCircleOutlined,
  EVENT: BellOutlined,
};

const eventTypeLabels: Record<string, string> = {
  MEETING: 'Họp',
  DEADLINE: 'Deadline',
  MILESTONE: 'Milestone',
  EVENT: 'Sự kiện',
};

const CalendarPage: React.FC = () => {
  const { token } = theme.useToken();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterProject, setFilterProject] = useState<string | undefined>();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);
  const [tab, setTab] = useState<'calendar' | 'list'>('calendar');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const allUsers = useSelector((state: RootState) => state.users.users);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [search, setSearch] = useState('');

  // CSS styles for table rows
  const tableRowStyles = `
    .calendar-table-row-even {
      background-color: ${token.colorBgContainer} !important;
    }
    .calendar-table-row-odd {
      background-color: ${token.colorBgLayout} !important;
    }
    .calendar-table-row-even:hover,
    .calendar-table-row-odd:hover {
      background-color: ${token.colorBgTextHover} !important;
    }
  `;

  useEffect(() => {
    fetchEvents();
    fetchProjects();
    if (!allUsers.length) dispatch(fetchUsersThunk() as any);
  }, [filterType, filterProject]);

  useEffect(() => {
    // Inject CSS styles for table rows
    const styleElement = document.createElement('style');
    styleElement.textContent = tableRowStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, [tableRowStyles]);

  useEffect(() => {
    // Error boundary effect
    const handleError = (error: ErrorEvent) => {
      console.error('CalendarPage error:', error);
      setRenderError(error.message);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  React.useEffect(() => {
    // Kết nối socket
    const socket = io('http://localhost:3001');
    const reload = () => {
      fetchEvents();
      antdMessage.info('Lịch sự kiện đã được cập nhật realtime!');
    };
    socket.on('calendar:event:created', reload);
    socket.on('calendar:event:updated', reload);
    socket.on('calendar:event:deleted', reload);
    socket.on('calendar:attendee:status', reload);
    return () => { socket.disconnect(); };
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filterType) params.type = filterType;
      if (filterProject) params.projectId = filterProject;
      console.log('Fetching calendar events with params:', params);
      
      const res = await axiosInstance.get('/calendar', { params });
      console.log('Calendar API response:', res.data);
      
      // Đảm bảo luôn là array
      let eventsData = [];
      if (Array.isArray(res.data)) {
        eventsData = res.data;
      } else if (Array.isArray(res.data?.events)) {
        eventsData = res.data.events;
      } else {
        console.warn('Unexpected events data format:', res.data);
        eventsData = [];
      }
      
      console.log('Fetched events:', eventsData.length, eventsData);
      setEvents(eventsData);
    } catch (e: any) {
      console.error('Error fetching events:', e);
      const errorMessage = e.response?.data?.error || 'Không thể tải dữ liệu lịch';
      setError(errorMessage);
      setEvents([]);
    }
    setLoading(false);
  };

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects for calendar...');
      const res = await axiosInstance.get('/projects');
      console.log('Projects API response:', res.data);
      
      let projectsData = [];
      if (Array.isArray(res.data)) {
        projectsData = res.data;
      } else if (Array.isArray(res.data?.projects)) {
        projectsData = res.data.projects;
      } else {
        console.warn('Unexpected projects data format:', res.data);
        projectsData = [];
      }
      
      console.log('Fetched projects:', projectsData.length, projectsData);
      setProjects(projectsData);
    } catch (e: any) {
      console.error('Error fetching projects:', e);
      const errorMessage = e.response?.data?.error || 'Không thể tải danh sách dự án';
      message.error(errorMessage);
      setProjects([]);
    }
  };

  const dateCellRender = (value: Dayjs) => {
    // Hiển thị sự kiện nếu ngày chọn nằm trong khoảng startDate - endDate (bao gồm allDay và không allDay)
    const dayEvents = events.filter(ev => {
      const start = dayjs(ev.startDate);
      const end = ev.endDate ? dayjs(ev.endDate) : start;
      const valueDate = value.format('YYYY-MM-DD');
      const startDate = start.format('YYYY-MM-DD');
      const endDate = end.format('YYYY-MM-DD');
      
      // Debug only for today
      if (valueDate === dayjs().format('YYYY-MM-DD')) {
        console.log('Checking event:', ev.title, 'valueDate:', valueDate, 'startDate:', startDate, 'endDate:', endDate);
      }
      
      return valueDate === startDate || valueDate === endDate || 
             (valueDate > startDate && valueDate < endDate);
    });

    // Debug only for today
    if (value.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')) {
      console.log('Events for today:', dayEvents.length);
    }

    return (
      <div style={{ minHeight: 80, padding: '4px' }}>
        {Array.isArray(dayEvents) && dayEvents.map(ev => {
          const IconComponent = eventTypeIcons[ev.type] || BellOutlined;
          const isToday = value.isSame(dayjs(), 'day');
          const isSelected = selectedDate && value.isSame(selectedDate, 'day');
          
          return (
            <div
              key={ev.id}
              style={{
                background: eventTypeColors[ev.type] || token.colorBgTextHover,
                color: token.colorBgContainer,
                padding: '4px 8px',
                margin: '2px 0',
                borderRadius: token.borderRadius,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: isToday ? `0 2px 4px ${token.colorBgTextHover}` : 'none',
                border: isSelected ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorBorder}`,
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = `0 4px 8px ${token.colorBgTextHover}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = isToday ? `0 2px 4px ${token.colorBgTextHover}` : 'none';
              }}
              onClick={() => openDrawer(ev)}
              title={`${ev.title} - ${eventTypeLabels[ev.type] || ev.type}`}
            >
              <IconComponent style={{ fontSize: '10px', flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ev.title}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const onSelect = (date: Dayjs) => {
    setSelectedDate(date);
    const dayEvents = Array.isArray(events) ? events.filter(ev => {
      const start = dayjs(ev.startDate);
      const end = ev.endDate ? dayjs(ev.endDate) : start;
      const dateStr = date.format('YYYY-MM-DD');
      const startDate = start.format('YYYY-MM-DD');
      const endDate = end.format('YYYY-MM-DD');
      
      return dateStr === startDate || dateStr === endDate || 
             (dateStr > startDate && dateStr < endDate);
    }) : [];
    setSelectedEvents(dayEvents);
    if (dayEvents.length > 0) {
      setModalOpen(true);
    }
  };

  const openDrawer = (event?: any) => {
    console.log('Opening drawer for event:', event);
    setEditingEvent(event);
    
    if (event) {
      // Edit mode - populate form with event data
      const formData = {
        title: event.title,
        description: event.description,
        type: event.type,
        projectId: event.projectId,
        location: event.location,
        range: [dayjs(event.startDate), dayjs(event.endDate || event.startDate)],
        isAllDay: event.isAllDay,
        color: event.color,
        reminder: event.reminder,
        attendees: event.attendees?.map((a: any) => a.userId || a.user?.id) || []
      };
      console.log('Setting form data for edit:', formData);
      form.setFieldsValue(formData);
    } else {
      // Create mode - reset form and set default values
      form.resetFields();
      form.setFieldsValue({
        type: 'MEETING',
        isAllDay: false,
        color: '#1890ff',
        reminder: 15
      });
    }
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      console.log('Deleting event:', id);
      const response = await axiosInstance.delete(`/calendar/${id}`);
      console.log('Delete response:', response.data);
      message.success('Đã xóa sự kiện thành công');
      fetchEvents();
      setModalOpen(false);
    } catch (e: any) {
      console.error('Error deleting event:', e);
      const errorMessage = e.response?.data?.error || 'Không thể xóa sự kiện';
      message.error(errorMessage);
    }
  };

  const handleFinish = async (values: any) => {
    try {
      console.log('Submitting event data:', values);
      
      const [startDate, endDate] = values.range;
      const data = {
        title: values.title?.trim(),
        description: values.description?.trim(),
        type: values.type,
        projectId: values.projectId,
        location: values.location?.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isAllDay: values.isAllDay || false,
        color: values.color,
        reminder: values.reminder,
        attendees: values.attendees || []
      };

      console.log('Processed event data:', data);

      if (editingEvent) {
        const response = await axiosInstance.put(`/calendar/${editingEvent.id}`, data);
        console.log('Update response:', response.data);
        message.success('Đã cập nhật sự kiện thành công');
      } else {
        const response = await axiosInstance.post('/calendar', data);
        console.log('Create response:', response.data);
        message.success('Đã tạo sự kiện mới thành công');
      }
      
      setDrawerOpen(false);
      setEditingEvent(null);
      form.resetFields();
      fetchEvents();
    } catch (e: any) {
      console.error('Error saving event:', e);
      const errorMessage = e.response?.data?.error || 'Có lỗi xảy ra khi lưu sự kiện';
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: 'Sự kiện',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: eventTypeColors[record.type] || '#d9d9d9',
              flexShrink: 0
            }}
          />
          <div>
            <div style={{ fontWeight: 500, color: token.colorText }}>{title}</div>
            {record.description && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.description}
              </Text>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const IconComponent = eventTypeIcons[type] || BellOutlined;
        return (
          <Tag color={eventTypeColors[type]} icon={<IconComponent />}>
            {eventTypeLabels[type] || type}
          </Tag>
        );
      }
    },
    {
      title: 'Dự án',
      dataIndex: ['project', 'name'],
      key: 'project',
      width: 150,
      render: (name: string) => name ? <Tag color="blue" icon={<ProjectOutlined />}>{name}</Tag> : '-'
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 200,
      render: (record: any) => (
                  <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ClockCircleOutlined style={{ color: token.colorPrimary }} />
              <span>{dayjs(record.startDate).format('DD/MM/YYYY HH:mm')}</span>
            </div>
            {record.endDate && record.endDate !== record.startDate && (
              <div style={{ fontSize: '12px', color: token.colorTextSecondary, marginTop: 2 }}>
                Đến: {dayjs(record.endDate).format('DD/MM/YYYY HH:mm')}
              </div>
            )}
          </div>
      )
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      render: (location: string) => location ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <EnvironmentOutlined style={{ color: token.colorSuccess }} />
          <span>{location}</span>
        </div>
      ) : '-'
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (record: any) => (
        <Space>
          <Button size="small" onClick={() => openDrawer(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa sự kiện này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Thống kê sự kiện
  const eventStats = {
    total: events.length,
    meeting: events.filter(e => e.type === 'MEETING').length,
    deadline: events.filter(e => e.type === 'DEADLINE').length,
    milestone: events.filter(e => e.type === 'MILESTONE').length,
    event: events.filter(e => e.type === 'EVENT').length,
  };

  console.log('CalendarPage rendering, events:', events.length);

  // Fallback nếu có lỗi
  if (!events) {
    console.log('Events is null/undefined, setting to empty array');
    setEvents([]);
  }

  // Error fallback
  if (renderError) {
    return (
      <div style={{ padding: 24, background: token.colorBgContainer, minHeight: '100vh' }}>
        <Alert
          message="Lỗi hiển thị"
          description={renderError}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>
          }
        />
      </div>
    );
  }

  // Simple fallback render
  if (loading) {
    return (
      <div style={{ padding: 24, background: token.colorBgContainer, minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: token.colorText }}>Đang tải lịch...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: token.colorBgContainer, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <CalendarOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
          <div>
            <Title level={2} style={{ margin: 0, color: token.colorText }}>Lịch Dự Án</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>Quản lý lịch họp, deadline, milestone và các sự kiện dự án</Text>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          marginBottom: 24, 
          padding: 16, 
          background: token.colorErrorBg, 
          border: `1px solid ${token.colorErrorBorder}`, 
          borderRadius: token.borderRadius
        }}>
          <Text type="danger" strong>Lỗi: {error}</Text>
          <Button 
            type="link" 
            onClick={() => fetchEvents()}
            style={{ padding: 0, marginLeft: 8 }}
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic 
              title="Tổng cộng" 
              value={eventStats.total} 
              prefix={<CalendarOutlined />}
              valueStyle={{ color: token.colorPrimary }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="Họp" 
              value={eventStats.meeting} 
              prefix={<TeamOutlined />}
              valueStyle={{ color: token.colorPrimary }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="Deadline" 
              value={eventStats.deadline} 
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: token.colorError }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="Milestone" 
              value={eventStats.milestone} 
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: token.colorWarning }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="Sự kiện" 
              value={eventStats.event} 
              prefix={<BellOutlined />}
              valueStyle={{ color: token.colorSuccess }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              style={{ 
                width: '100%', 
                height: '100%',
                background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                border: 'none',
                borderRadius: token.borderRadius
              }}
              onClick={() => openDrawer()}
            >
              Tạo Sự Kiện
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Tabs
              activeKey={tab}
              onChange={key => setTab(key as 'calendar' | 'list')}
              size="large"
              style={{ marginBottom: 0 }}
              items={[
                { key: 'calendar', label: 'Lịch Tháng', children: null },
                { key: 'list', label: 'Danh Sách', children: null }
              ]}
            />
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Tìm kiếm sự kiện..."
                allowClear
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 250 }}
                prefix={<SearchOutlined />}
              />
              <Select
                placeholder="Tất cả loại"
                allowClear
                style={{ width: 140 }}
                value={filterType}
                onChange={setFilterType}
                prefix={<FilterOutlined />}
              >
                <Option value="MEETING">Họp</Option>
                <Option value="DEADLINE">Deadline</Option>
                <Option value="MILESTONE">Milestone</Option>
                <Option value="EVENT">Sự kiện khác</Option>
              </Select>
              <Select
                placeholder="Tất cả dự án"
                allowClear
                style={{ width: 180 }}
                value={filterProject}
                onChange={setFilterProject}
                showSearch
                optionFilterProp="children"
                prefix={<ProjectOutlined />}
              >
                {Array.isArray(projects) && projects.map((p: any) => (
                  <Option key={p.id} value={p.id}>{p.name}</Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Calendar/List Content */}
      <Card style={{ minHeight: 600 }}>
        {tab === 'calendar' && (
          <Spin spinning={loading}>
            <Calendar
              dateCellRender={dateCellRender}
              onSelect={onSelect}
              value={selectedDate || dayjs()}
              style={{ 
                background: token.colorBgContainer, 
                borderRadius: token.borderRadius, 
                padding: 16,
                fontSize: 14
              }}
              headerRender={({ value, onChange }) => (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '16px 0',
                  borderBottom: '1px solid #f0f0f0',
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Button 
                      onClick={() => onChange(value.clone().subtract(1, 'month'))}
                      icon={<CalendarOutlined />}
                    >
                      Tháng trước
                    </Button>
                    <Title level={4} style={{ margin: 0 }}>
                      {value.format('MMMM YYYY')}
                    </Title>
                    <Button 
                      onClick={() => onChange(value.clone().add(1, 'month'))}
                      icon={<CalendarOutlined />}
                    >
                      Tháng sau
                    </Button>
                  </div>
                  <Button 
                    type="primary" 
                    onClick={() => onChange(dayjs())}
                    icon={<CalendarOutlined />}
                  >
                    Hôm nay
                  </Button>
                </div>
              )}
            />
          </Spin>
        )}
        {tab === 'list' && (
          <Spin spinning={loading}>
            {events.length === 0 ? (
              <Empty
                description="Không có sự kiện nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '60px 0' }}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}>
                  Tạo sự kiện đầu tiên
                </Button>
              </Empty>
            ) : (
              <Table 
                rowKey="id" 
                columns={columns} 
                dataSource={Array.isArray(events) ? events.filter(ev => 
                  !search || 
                  ev.title?.toLowerCase().includes(search.toLowerCase()) || 
                  ev.description?.toLowerCase().includes(search.toLowerCase())
                ) : []} 
                pagination={{ pageSize: 10 }} 
                locale={{ emptyText: 'Không có sự kiện nào.' }}
                style={{ 
                  background: token.colorBgContainer,
                  borderRadius: token.borderRadius,
                  border: `1px solid ${token.colorBorder}`
                }}
                rowClassName={(record, index) => {
                  return index % 2 === 0 ? 'calendar-table-row-even' : 'calendar-table-row-odd';
                }}
              />
            )}
          </Spin>
        )}
      </Card>

      {/* Selected Date Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined style={{ color: token.colorPrimary }} />
            <span>Sự kiện ngày {selectedDate?.format('DD/MM/YYYY')}</span>
          </div>
        }
        width={600}
      >
        {selectedEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <CalendarOutlined style={{ fontSize: 48, color: token.colorTextSecondary, marginBottom: 16 }} />
            <div style={{ color: token.colorTextSecondary }}>Không có sự kiện nào trong ngày này</div>
          </div>
        ) : (
          <List
            dataSource={Array.isArray(selectedEvents) ? selectedEvents : []}
            renderItem={(event) => {
              const IconComponent = eventTypeIcons[event.type] || BellOutlined;
              return (
                <List.Item
                  actions={[
                    <Button size="small" onClick={() => openDrawer(event)}>
                      Sửa
                    </Button>,
                    <Popconfirm
                      title="Xóa sự kiện này?"
                      onConfirm={() => handleDelete(event.id)}
                      okText="Có"
                      cancelText="Không"
                    >
                      <Button size="small" danger>
                        Xóa
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          backgroundColor: eventTypeColors[event.type] || '#d9d9d9',
                          color: '#fff'
                        }}
                        icon={<IconComponent />}
                      />
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 500 }}>{event.title}</span>
                        <Tag color={eventTypeColors[event.type]} icon={<IconComponent />}>
                          {eventTypeLabels[event.type] || event.type}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          <ClockCircleOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
                          {dayjs(event.startDate).format('HH:mm')} - {dayjs(event.endDate || event.startDate).format('HH:mm')}
                        </div>
                        {event.description && (
                          <div style={{ color: token.colorTextSecondary }}>
                            <FileTextOutlined style={{ marginRight: 8 }} />
                            {event.description}
                          </div>
                        )}
                        {event.location && (
                          <div style={{ marginTop: 4 }}>
                            <EnvironmentOutlined style={{ marginRight: 8, color: token.colorSuccess }} />
                            {event.location}
                          </div>
                        )}
                        {event.project && (
                          <div style={{ marginTop: 4 }}>
                            <ProjectOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
                            {event.project.name}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Modal>

      {/* Event Form Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined style={{ color: token.colorPrimary }} />
            <span>{editingEvent ? 'Sửa sự kiện' : 'Tạo sự kiện'}</span>
          </div>
        }
        width={520}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ isAllDay: false }}
        >
          <Form.Item 
            name="title" 
            label="Tên sự kiện" 
            rules={[{ required: true, message: 'Nhập tên sự kiện!' }]}
          >
            <Input placeholder="Nhập tên sự kiện" />
          </Form.Item>
          
          <Form.Item 
            name="type" 
            label="Loại sự kiện" 
            rules={[{ required: true, message: 'Chọn loại sự kiện!' }]}
          >
            <Select placeholder="Chọn loại sự kiện">
              <Option value="MEETING">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamOutlined style={{ color: token.colorPrimary }} />
                  Họp
                </div>
              </Option>
              <Option value="DEADLINE">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ExclamationCircleOutlined style={{ color: token.colorError }} />
                  Deadline
                </div>
              </Option>
              <Option value="MILESTONE">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircleOutlined style={{ color: token.colorWarning }} />
                  Milestone
                </div>
              </Option>
              <Option value="EVENT">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BellOutlined style={{ color: token.colorSuccess }} />
                  Sự kiện khác
                </div>
              </Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="projectId" label="Dự án">
            <Select 
              allowClear 
              showSearch 
              optionFilterProp="children"
              placeholder="Chọn dự án (tùy chọn)"
            >
              {projects.map((p: any) => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="location" label="Địa điểm">
            <Input placeholder="Nhập địa điểm (tùy chọn)" />
          </Form.Item>
          
          <Form.Item 
            name="range" 
            label="Thời gian" 
            rules={[{ required: true, message: 'Chọn thời gian!' }]}
          >
            <RangePicker 
              showTime 
              format="DD/MM/YYYY HH:mm" 
              style={{ width: '100%' }}
              placeholder={['Bắt đầu', 'Kết thúc']}
            />
          </Form.Item>
          
          <Form.Item name="isAllDay" label="Cả ngày" valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea 
              rows={3} 
              placeholder="Nhập mô tả sự kiện (tùy chọn)"
            />
          </Form.Item>
          
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)} style={{ marginRight: 8 }}>
              Huỷ
            </Button>
            <Button type="primary" htmlType="submit">
              {editingEvent ? 'Cập nhật' : 'Tạo sự kiện'}
            </Button>
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

export default CalendarPage; 