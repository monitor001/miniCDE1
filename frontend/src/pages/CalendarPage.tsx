import React, { useEffect, useState } from 'react';
import { Calendar, Badge, Select, Spin, Modal, List, Button, Tag, Table, Drawer, Form, Input, DatePicker, Switch, message, Popconfirm, Tabs, Row, Col } from 'antd';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers as fetchUsersThunk } from '../store/slices/userSlice';
import { RootState } from '../store';
import io from 'socket.io-client';
import { message as antdMessage } from 'antd';

const { Option } = Select;
const { RangePicker } = DatePicker;

const eventTypeColors: Record<string, string> = {
  MEETING: 'blue',
  DEADLINE: 'red',
  MILESTONE: 'gold',
  EVENT: 'green',
};

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetchEvents();
    fetchProjects();
    if (!allUsers.length) dispatch(fetchUsersThunk() as any);
  }, [filterType, filterProject]);

  React.useEffect(() => {
    // Kết nối socket
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001');
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
    try {
      const params: any = {};
      if (filterType) params.type = filterType;
      if (filterProject) params.projectId = filterProject;
      const res = await axios.get('/api/calendar', { params });
      setEvents(res.data || []);
    } catch (e) {
      setEvents([]);
    }
    setLoading(false);
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects');
      setProjects(res.data.projects || res.data || []);
    } catch (e) {
      setProjects([]);
    }
  };

  const dateCellRender = (value: Dayjs) => {
    // Hiển thị sự kiện nếu ngày chọn nằm trong khoảng startDate - endDate (bao gồm allDay và không allDay)
    const dayEvents = events.filter(ev => {
      const start = dayjs(ev.startDate);
      const end = ev.endDate ? dayjs(ev.endDate) : start;
      return value.isSame(start, 'day') || value.isSame(end, 'day') || (value.isAfter(start, 'day') && value.isBefore(end, 'day'));
    });
    return (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {dayEvents.map(ev => (
          <li key={ev.id}>
            <Badge color={eventTypeColors[ev.type] || 'gray'} text={ev.title} />
          </li>
        ))}
      </ul>
    );
  };

  const onSelect = (date: Dayjs) => {
    setSelectedDate(date);
    // Lọc sự kiện có ngày chọn nằm trong khoảng startDate - endDate
    const dayEvents = events.filter(ev => {
      const start = dayjs(ev.startDate);
      const end = ev.endDate ? dayjs(ev.endDate) : start;
      return date.isSame(start, 'day') || date.isSame(end, 'day') || (date.isAfter(start, 'day') && date.isBefore(end, 'day'));
    });
    setSelectedEvents(dayEvents);
    setModalOpen(true);
  };

  // CRUD handlers for list
  const openDrawer = (event?: any) => {
    setEditingEvent(event || null);
    if (event) {
      form.setFieldsValue({
        ...event,
        range: [dayjs(event.startDate), dayjs(event.endDate)],
        isAllDay: !!event.isAllDay,
        projectId: event.projectId,
        attendees: event.attendees?.map((a: any) => a.userId || a.user?.id) || [],
      });
    } else {
      form.resetFields();
    }
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/calendar/${id}`);
      message.success('Đã xoá sự kiện');
      fetchEvents();
    } catch (e) {
      message.error('Không thể xoá sự kiện');
    }
  };

  const handleFinish = async (values: any) => {
    try {
      const data = {
        ...values,
        startDate: values.range[0].toISOString(),
        endDate: values.range[1].toISOString(),
        isAllDay: !!values.isAllDay,
      };
      if (editingEvent) {
        await axios.put(`/api/calendar/${editingEvent.id}`, data);
        message.success('Đã cập nhật sự kiện');
      } else {
        await axios.post('/api/calendar', data);
        message.success('Đã thêm sự kiện');
      }
      setDrawerOpen(false);
      fetchEvents();
    } catch (e) {
      message.error('Không thể lưu sự kiện');
    }
  };

  const columns = [
    { title: 'Tên sự kiện', dataIndex: 'title', key: 'title', render: (text: string, record: any) => <span style={{ fontWeight: 600 }}>{text}</span> },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: (type: string) => <Tag color={eventTypeColors[type] || 'gray'}>{type}</Tag> },
    { title: 'Dự án', dataIndex: ['project', 'name'], key: 'project', render: (_: any, r: any) => r.project?.name || '-' },
    { title: 'Bắt đầu', dataIndex: 'startDate', key: 'startDate', render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm') },
    { title: 'Kết thúc', dataIndex: 'endDate', key: 'endDate', render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm') },
    { title: 'Cả ngày', dataIndex: 'isAllDay', key: 'isAllDay', render: (v: boolean) => v ? '✔️' : '' },
    { title: 'Tham gia', key: 'attendees', render: (_: any, r: any) => (
      <div>
        {r.attendees?.map((a: any) => (
          <Tag key={a.userId || a.user?.id} color={
            a.status === 'ACCEPTED' ? 'green' :
            a.status === 'DECLINED' ? 'red' :
            a.status === 'TENTATIVE' ? 'gold' : 'blue'
          }>
            {a.user?.name || a.userId} ({a.status || 'INVITED'})
          </Tag>
        ))}
      </div>
    ) },
    { title: 'Hành động', key: 'action', render: (_: any, r: any) => (
      <>
        <Button type="link" onClick={() => openDrawer(r)}>Sửa</Button>
        <Popconfirm title="Xoá sự kiện này?" onConfirm={() => handleDelete(r.id)} okText="Có" cancelText="Không">
          <Button type="link" danger>Xoá</Button>
        </Popconfirm>
        {/* Nếu user là attendee, cho phép đổi trạng thái */}
        {r.attendees?.some((a: any) => a.userId === currentUser?.id || a.user?.id === currentUser?.id) && (
          <Select
            size="small"
            style={{ width: 120, marginLeft: 8 }}
            value={r.attendees.find((a: any) => a.userId === currentUser?.id || a.user?.id === currentUser?.id)?.status || 'INVITED'}
            onChange={async (status) => {
              try {
                await axios.patch(`/api/calendar/${r.id}/attendee/status`, { status });
                message.success('Đã cập nhật trạng thái tham gia');
                fetchEvents();
              } catch {
                message.error('Không thể cập nhật trạng thái');
              }
            }}
            options={[
              { value: 'ACCEPTED', label: 'Tham gia' },
              { value: 'DECLINED', label: 'Từ chối' },
              { value: 'TENTATIVE', label: 'Cân nhắc' },
              { value: 'INVITED', label: 'Mời' },
            ]}
          />
        )}
      </>
    ) },
  ];

  return (
    <div style={{ padding: 24, background: '#f7f9fb', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 0 }}>Lịch Dự Án</h1>
        <div style={{ color: '#888', fontSize: 16 }}>Quản lý lịch họp, deadline, milestone và các sự kiện dự án</div>
      </div>
      <Row align="middle" justify="space-between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Col flex="auto">
          <Tabs
            activeKey={tab}
            onChange={key => setTab(key as 'calendar' | 'list')}
            size="large"
            style={{ marginBottom: 0 }}
            items={[
              { key: 'calendar', label: 'Tháng', children: null },
              { key: 'list', label: 'Danh Sách', children: null }
            ]}
          />
        </Col>
        <Col>
          <Button type="primary" shape="round" size="large" style={{ fontWeight: 600 }} onClick={() => openDrawer()}>+ Tạo Sự Kiện</Button>
        </Col>
      </Row>
      <Row align="middle" justify="end" style={{ marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
        <Col>
          <Input.Search
            placeholder="Tìm kiếm sự kiện..."
            allowClear
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
        </Col>
        <Col>
          <Select
            placeholder="Tất cả loại"
            allowClear
            style={{ width: 140 }}
            value={filterType}
            onChange={setFilterType}
          >
            <Option value="MEETING">Họp</Option>
            <Option value="DEADLINE">Deadline</Option>
            <Option value="MILESTONE">Milestone</Option>
            <Option value="EVENT">Sự kiện khác</Option>
          </Select>
        </Col>
        <Col>
          <Select
            placeholder="Tất cả dự án"
            allowClear
            style={{ width: 160 }}
            value={filterProject}
            onChange={setFilterProject}
            showSearch
            optionFilterProp="children"
          >
            {projects.map((p: any) => (
              <Option key={p.id} value={p.id}>{p.name}</Option>
            ))}
          </Select>
        </Col>
      </Row>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #0001', minHeight: 600 }}>
        {tab === 'calendar' && (
          <Spin spinning={loading}>
            <Calendar
              dateCellRender={dateCellRender}
              onSelect={onSelect}
              value={selectedDate || dayjs()}
              style={{ background: '#fff', borderRadius: 8, padding: 16 }}
            />
          </Spin>
        )}
        {tab === 'list' && (
          <Spin spinning={loading}>
            <Table rowKey="id" columns={columns} dataSource={events.filter(ev => !search || ev.title?.toLowerCase().includes(search.toLowerCase()) || ev.description?.toLowerCase().includes(search.toLowerCase()))} pagination={{ pageSize: 10 }} locale={{ emptyText: 'Không có sự kiện nào.' }} />
          </Spin>
        )}
      </div>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingEvent ? 'Sửa sự kiện' : 'Tạo sự kiện'}
        width={480}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ isAllDay: false }}
        >
          <Form.Item name="title" label="Tên sự kiện" rules={[{ required: true, message: 'Nhập tên sự kiện!' }]}> <Input /> </Form.Item>
          <Form.Item name="type" label="Loại sự kiện" rules={[{ required: true, message: 'Chọn loại sự kiện!' }]}> <Select>
            <Option value="MEETING">Họp</Option>
            <Option value="DEADLINE">Deadline</Option>
            <Option value="MILESTONE">Milestone</Option>
            <Option value="EVENT">Sự kiện khác</Option>
          </Select> </Form.Item>
          <Form.Item name="projectId" label="Dự án"> <Select allowClear showSearch optionFilterProp="children">
            {projects.map((p: any) => (
              <Option key={p.id} value={p.id}>{p.name}</Option>
            ))}
          </Select> </Form.Item>
          <Form.Item name="attendees" label="Người tham gia">
            <Select
              mode="multiple"
              placeholder="Chọn người tham gia"
              options={allUsers.map((u: any) => ({ value: u.id, label: u.name }))}
              showSearch
              style={{ width: '100%' }}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="range" label="Thời gian" rules={[{ required: true, message: 'Chọn thời gian!' }]}> <RangePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} /> </Form.Item>
          <Form.Item name="isAllDay" label="Cả ngày" valuePropName="checked"> <Switch /> </Form.Item>
          <Form.Item name="description" label="Mô tả"> <Input.TextArea rows={3} /> </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)} style={{ marginRight: 8 }}>Huỷ</Button>
            <Button type="primary" htmlType="submit">Lưu</Button>
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

export default Calendar; 