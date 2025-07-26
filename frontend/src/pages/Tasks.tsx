import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Modal, Form, Input, Select, DatePicker, Space, Popconfirm, message, Tooltip, Drawer, List } from 'antd';
import axiosInstance from '../axiosConfig';
import moment from 'moment';
import { useOutletContext } from 'react-router-dom';
import io from 'socket.io-client';
import debounce from 'lodash.debounce';
import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvided, type DraggableStateSnapshot, type DroppableProvided, type DroppableStateSnapshot } from '@hello-pangea/dnd';
import { HistoryOutlined } from '@ant-design/icons';

const { Option } = Select;

const statusColors: any = {
  'Đang thực hiện': 'blue',
  'Hoàn thành': 'green',
  'Quá hạn': 'red',
};

const statusList = ['Đang thực hiện', 'Hoàn thành', 'Quá hạn'];

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [form] = Form.useForm();
  const outletContext = useOutletContext<{ role?: string }>() || {};
  const role = outletContext.role || '';
  const [filter, setFilter] = useState({ name: '', status: '', assigneeId: '', dueDate: null });
  const [kanbanTasks, setKanbanTasks] = useState<{ [key: string]: any[] }>({});
  const [historyDrawer, setHistoryDrawer] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyTaskId, setHistoryTaskId] = useState<string>('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/tasks');
      setTasks(res.data as any[]);
    } catch (e) {
      console.error('Lỗi fetchTasks:', e);
      message.error('Không thể tải danh sách công việc!');
      setTasks([]);
    }
    setLoading(false);
  };
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/users');
      setUsers(Array.isArray(res.data) ? res.data as any[] : []);
    } catch (e) {
      console.error('Lỗi fetchUsers:', e);
      message.error('Không thể tải danh sách người dùng!');
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    
    // Cấu hình Socket.IO với URL chính xác
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
    console.log('Connecting to Socket.IO at:', socketUrl);
    
    try {
      const socket = io(socketUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      const showRealtimeToast = debounce((msg: string) => message.info(msg), 1000, { leading: true, trailing: false });
      const showCommentToast = debounce((msg: string) => message.info(msg), 1000, { leading: true, trailing: false });
      const showReminderToast = debounce((msg: string) => message.warning(msg), 1000, { leading: true, trailing: false });
      
      socket.on('connect', () => {
        console.log('Socket.IO connected successfully:', socket.id);
      });
      
      socket.on('connect_error', (error: Error) => {
        console.error('Socket.IO connection error:', error);
      });
      
      socket.on('task:new', (task: any) => {
        showRealtimeToast('Có công việc mới: ' + task.title);
        fetchTasks();
      });
      
      socket.on('comment:new', (comment: any) => {
        showCommentToast('Có bình luận mới cho công việc!');
        fetchTasks();
      });
      
      socket.on('task:reminder', (data: any) => {
        showReminderToast(data.message);
      });
      
      return () => { 
        console.log('Disconnecting Socket.IO');
        socket.disconnect(); 
      };
    } catch (error) {
      console.error('Error initializing Socket.IO:', error);
      return () => {};
    }
  }, []);

  useEffect(() => {
    // Kanban grouping
    const grouped: { [key: string]: any[] } = { 'Đang thực hiện': [], 'Hoàn thành': [], 'Quá hạn': [] };
    tasks.forEach(task => {
      if (grouped[task.status]) grouped[task.status].push(task);
    });
    setKanbanTasks(grouped);
  }, [tasks]);

  const handleEdit = (record: any) => {
    setEditingTask(record);
    form.setFieldsValue({
      ...record,
      dueDate: record.dueDate ? moment(record.dueDate) : null,
      status: record.status || undefined,
      assigneeId: record.assignee?.id || undefined,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await axiosInstance.delete(`/tasks/${id}`);
    message.success('Đã xóa công việc');
    fetchTasks();
  };

  const handleAdd = () => {
    setEditingTask(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // Log giá trị submit để debug
      console.log('Submit task values:', values);
      
      // Kiểm tra các trường bắt buộc
      if (!values.title) {
        message.error('Vui lòng nhập tên công việc!');
        return;
      }
      
      if (!values.status) {
        message.error('Vui lòng chọn trạng thái!');
        return;
      }
      
      if (!values.dueDate) {
        message.error('Vui lòng chọn ngày hết hạn!');
        return;
      }
      
      // Đảm bảo dueDate là string ISO, assigneeId là string hoặc undefined
      const submitData = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.format() : undefined,
        assigneeId: values.assigneeId || undefined,
      };
      if (editingTask) {
        await axiosInstance.put(`/tasks/${editingTask.id}`, submitData);
        message.success('Đã cập nhật công việc');
      } else {
        await axiosInstance.post('/tasks', submitData);
        message.success('Đã thêm công việc');
      }
      setModalOpen(false);
      fetchTasks();
    } catch (e: any) {
      console.error('Error in handleOk:', e);
      message.error(e?.response?.data?.error || e?.message || JSON.stringify(e));
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;
    // Cập nhật trạng thái task
    const task = kanbanTasks[source.droppableId].find(t => t.id === draggableId);
    if (task) {
      await axiosInstance.put(`/tasks/${task.id}`, { ...task, status: destination.droppableId });
      message.success('Cập nhật trạng thái thành công!');
      fetchTasks();
    }
  };

  const fetchHistory = async (id: string) => {
    setHistoryTaskId(id);
    setHistoryDrawer(true);
    const res = await axiosInstance.get(`/tasks/${id}`);
    const data = res.data as any;
    setHistoryList(Array.isArray(data.history) ? data.history : []);
  };

  const filteredTasks = tasks.filter(task =>
    (!filter.name || task.title.toLowerCase().includes(filter.name.toLowerCase())) &&
    (!filter.status || task.status === filter.status) &&
    (!filter.assigneeId || (task.assignee && task.assignee.id === filter.assigneeId)) &&
    (!filter.dueDate || moment(task.dueDate).isSame(filter.dueDate, 'day'))
  );
  const columns = [
    { title: 'Tên công việc', dataIndex: 'title', key: 'title' },
    { title: 'Ngày hết hạn', dataIndex: 'dueDate', key: 'dueDate', render: (date: string) => moment(date).format('DD/MM/YYYY') },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={statusColors[status] || 'default'}>{status}</Tag> },
    { title: 'Người thực hiện', dataIndex: ['assignee', 'name'], key: 'assignee', render: (name: string) => name || '-' },
    {
      title: 'Hành động', key: 'action', render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>Sửa</Button>
          <Button icon={<HistoryOutlined />} size="small" onClick={() => fetchHistory(record.id)} />
          <Popconfirm title="Xóa công việc này?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Input placeholder="Tìm tên công việc" style={{ width: 200 }} value={filter.name} onChange={e => setFilter(f => ({ ...f, name: e.target.value }))} />
        <Select placeholder="Trạng thái" style={{ width: 150 }} allowClear value={filter.status || undefined} onChange={v => setFilter(f => ({ ...f, status: v || '' }))} options={['Đang thực hiện', 'Hoàn thành', 'Quá hạn'].map(s => ({ value: s, label: s }))} />
        <Select placeholder="Người thực hiện" style={{ width: 180 }} allowClear value={filter.assigneeId || undefined} onChange={v => setFilter(f => ({ ...f, assigneeId: v || '' }))} options={users.map((u: any) => ({ value: u.id, label: u.name }))} />
        <DatePicker placeholder="Ngày hết hạn" style={{ width: 140 }} value={filter.dueDate} onChange={d => setFilter(f => ({ ...f, dueDate: d }))} />
        <Button onClick={() => setFilter({ name: '', status: '', assigneeId: '', dueDate: null })}>Xóa lọc</Button>
        <Button type="primary" onClick={handleAdd}>Thêm công việc</Button>
      </div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {statusList.map(status => (
            <Droppable droppableId={status} key={status}>
              {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    background: snapshot.isDraggingOver ? '#e6f7ff' : '#fafafa',
                    padding: 12,
                    minWidth: 280,
                    minHeight: 400,
                    borderRadius: 8,
                    boxShadow: '0 2px 8px #0001',
                  }}
                >
                  <h3 style={{ textAlign: 'center' }}>{status}</h3>
                  {kanbanTasks[status]?.map((task, idx) => (
                    <Draggable draggableId={task.id} index={idx} key={task.id}>
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            userSelect: 'none',
                            margin: '0 0 8px 0',
                            padding: 12,
                            background: snapshot.isDragging ? '#bae7ff' : '#fff',
                            border: '1px solid #d9d9d9',
                            borderRadius: 6,
                            ...provided.draggableProps.style,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{task.title}</div>
                          <div>Hạn: {moment(task.dueDate).format('DD/MM/YYYY')}</div>
                          <div>Người thực hiện: {task.assignee?.name || '-'}</div>
                          <div style={{ marginTop: 8 }}>
                            <Button size="small" onClick={() => handleEdit(task)} style={{ marginRight: 8 }}>Sửa</Button>
                            <Button icon={<HistoryOutlined />} size="small" onClick={() => fetchHistory(task.id)} style={{ marginRight: 8 }} />
                            <Popconfirm title="Xóa công việc này?" onConfirm={() => handleDelete(task.id)}>
                              <Button size="small" danger>Xóa</Button>
                            </Popconfirm>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>
      {/* Bảng Table cũ giữ lại để so sánh */}
      <Table rowKey="id" columns={columns} dataSource={filteredTasks} loading={loading} bordered style={{ marginTop: 24 }} />
      <Modal open={modalOpen} title={editingTask ? 'Sửa công việc' : 'Thêm công việc'} onOk={handleOk} onCancel={() => setModalOpen(false)} okButtonProps={{ disabled: loading }}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Tên công việc" rules={[{ required: true, message: 'Nhập tên công việc!' }]}> <Input /> </Form.Item>
          <Form.Item name="description" label="Mô tả"> <Input.TextArea /> </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Chọn trạng thái!' }]}> <Select allowClear>
            <Option value="Đang thực hiện">Đang thực hiện</Option>
            <Option value="Hoàn thành">Hoàn thành</Option>
            <Option value="Quá hạn">Quá hạn</Option>
          </Select> </Form.Item>
          <Form.Item name="dueDate" label="Ngày hết hạn" rules={[{ required: true, message: 'Chọn ngày hết hạn!' }]}> <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /> </Form.Item>
          <Form.Item name="assigneeId" label="Người thực hiện"> <Select showSearch optionFilterProp="label" options={users.map((u: any) => ({ value: u.id, label: u.name }))} allowClear /> </Form.Item>
        </Form>
      </Modal>
      <Drawer open={historyDrawer} onClose={() => setHistoryDrawer(false)} title="Lịch sử công việc" width={480}>
        <List
          dataSource={historyList}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={<span>{item.action}</span>}
                description={<span>{item.userId} lúc {new Date(item.timestamp).toLocaleString()}</span>}
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
};

export default Tasks; 