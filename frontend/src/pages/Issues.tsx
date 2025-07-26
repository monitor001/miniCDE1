import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Space, Popconfirm, Typography } from 'antd';
import axiosInstance from '../axiosConfig';
import { useSelector } from 'react-redux';

const { Option } = Select;
const { Title } = Typography;

const statusOptions = [
  { value: 'NEW', label: 'Mới', color: 'blue' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý', color: 'orange' },
  { value: 'RESOLVED', label: 'Đã xử lý', color: 'green' },
  { value: 'CLOSED', label: 'Đã đóng', color: 'default' },
  { value: 'OVERDUE', label: 'Quá hạn', color: 'red' }
];
const priorityOptions = [
  { value: 'HIGH', label: 'Cao', color: 'red' },
  { value: 'MEDIUM', label: 'Trung bình', color: 'orange' },
  { value: 'LOW', label: 'Thấp', color: 'green' }
];
const typeOptions = [
  { value: 'ISSUE', label: 'Vấn đề' },
  { value: 'RFI', label: 'RFI' }
];

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState({ status: '', priority: '', type: '', projectId: '' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const user = useSelector((state:any) => state.auth.user);

  useEffect(() => {
    fetchIssues();
    fetchUsers();
    fetchProjects();
  }, [pagination.current, pagination.pageSize, filter]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filter
      };
      const res = await axiosInstance.get('/issues', { params });
      setIssues(res.data.issues);
      setPagination(p => ({ ...p, total: res.data.total }));
    } catch (e) {
      message.error('Không thể tải danh sách vấn đề!');
    }
    setLoading(false);
  };
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/users');
      setUsers(res.data.users || res.data);
    } catch {}
  };
  const fetchProjects = async () => {
    try {
      const res = await axiosInstance.get('/projects');
      setProjects(res.data.projects || res.data);
    } catch {}
  };

  const handleAdd = () => {
    setEditingIssue(null);
    form.resetFields();
    setModalOpen(true);
  };
  const handleEdit = (record:any) => {
    setEditingIssue(record);
    form.setFieldsValue({
      ...record,
      projectId: record.project?.id,
      assigneeId: record.assignee?.id
    });
    setModalOpen(true);
  };
  const handleDelete = async (id:string) => {
    try {
      await axiosInstance.delete(`/issues/${id}`);
      message.success('Đã xoá vấn đề');
      fetchIssues();
    } catch {
      message.error('Không thể xoá vấn đề!');
    }
  };
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingIssue) {
        await axiosInstance.put(`/issues/${editingIssue.id}`, values);
        message.success('Đã cập nhật vấn đề');
      } else {
        await axiosInstance.post('/issues', values);
        message.success('Đã tạo vấn đề');
      }
      setModalOpen(false);
      fetchIssues();
    } catch {
      message.error('Vui lòng kiểm tra lại thông tin!');
    }
  };

  const columns = [
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title', render: (t:string, r:any) => <b>{t}</b> },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: (v:string) => typeOptions.find(o=>o.value===v)?.label || v },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (v:string) => <Tag color={statusOptions.find(o=>o.value===v)?.color}>{statusOptions.find(o=>o.value===v)?.label||v}</Tag> },
    { title: 'Ưu tiên', dataIndex: 'priority', key: 'priority', render: (v:string) => <Tag color={priorityOptions.find(o=>o.value===v)?.color}>{priorityOptions.find(o=>o.value===v)?.label||v}</Tag> },
    { title: 'Dự án', dataIndex: ['project','name'], key: 'project', render: (t:string) => t||'-' },
    { title: 'Người tạo', dataIndex: ['createdBy','name'], key: 'createdBy', render: (t:string) => t||'-' },
    { title: 'Người được giao', dataIndex: ['assignee','name'], key: 'assignee', render: (t:string) => t||'-' },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (v:string) => v ? new Date(v).toLocaleString() : '-' },
    { title: 'Ngày cập nhật', dataIndex: 'updatedAt', key: 'updatedAt', render: (v:string) => v ? new Date(v).toLocaleString() : '-' },
    {
      title: 'Hành động', key: 'action', render: (_:any, record:any) => {
        const canEdit = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER' || user?.role === 'BIM_MANAGER' || user?.id === record.createdBy?.id || user?.id === record.assignee?.id;
        return <Space>
          <Button type="link" onClick={()=>handleEdit(record)} disabled={!canEdit}>Sửa</Button>
          <Popconfirm title="Xoá vấn đề này?" onConfirm={()=>handleDelete(record.id)} okText="Có" cancelText="Không" disabled={!canEdit}>
            <Button type="link" danger disabled={!canEdit}>Xoá</Button>
          </Popconfirm>
        </Space>
      }
    }
  ];

  return (
    <div style={{padding:24}}>
      <Title level={3}>Quản lý thẻ Vấn đề (Issue)</Title>
      <Space style={{marginBottom:16}}>
        <Button type="primary" onClick={handleAdd}>Thêm vấn đề</Button>
        <Select placeholder="Trạng thái" allowClear style={{width:120}} value={filter.status||undefined} onChange={v=>setFilter(f=>({...f,status:v||''}))}>
          {statusOptions.map(o=><Option key={o.value} value={o.value}>{o.label}</Option>)}
        </Select>
        <Select placeholder="Ưu tiên" allowClear style={{width:120}} value={filter.priority||undefined} onChange={v=>setFilter(f=>({...f,priority:v||''}))}>
          {priorityOptions.map(o=><Option key={o.value} value={o.value}>{o.label}</Option>)}
        </Select>
        <Select placeholder="Loại" allowClear style={{width:120}} value={filter.type||undefined} onChange={v=>setFilter(f=>({...f,type:v||''}))}>
          {typeOptions.map(o=><Option key={o.value} value={o.value}>{o.label}</Option>)}
        </Select>
        <Select placeholder="Dự án" allowClear style={{width:180}} value={filter.projectId||undefined} onChange={v=>setFilter(f=>({...f,projectId:v||''}))} showSearch optionFilterProp="children">
          {projects.map((p:any)=><Option key={p.id} value={p.id}>{p.name}</Option>)}
        </Select>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={issues}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, pageSize) => setPagination(p=>({...p,current:page,pageSize}))
        }}
        bordered
      />
      <Modal open={modalOpen} title={editingIssue?'Sửa vấn đề':'Thêm vấn đề'} onOk={handleOk} onCancel={()=>setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Tiêu đề" rules={[{required:true,message:'Nhập tiêu đề!'}]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="type" label="Loại" rules={[{required:true,message:'Chọn loại!'}]}>
            <Select>
              {typeOptions.map(o=><Option key={o.value} value={o.value}>{o.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{required:true,message:'Chọn trạng thái!'}]}>
            <Select>
              {statusOptions.map(o=><Option key={o.value} value={o.value}>{o.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Ưu tiên" rules={[{required:true,message:'Chọn ưu tiên!'}]}>
            <Select>
              {priorityOptions.map(o=><Option key={o.value} value={o.value}>{o.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="projectId" label="Dự án" rules={[{required:true,message:'Chọn dự án!'}]}>
            <Select showSearch optionFilterProp="children">
              {projects.map((p:any)=><Option key={p.id} value={p.id}>{p.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="assigneeId" label="Người được giao">
            <Select showSearch optionFilterProp="children" allowClear>
              {users.map((u:any)=><Option key={u.id} value={u.id}>{u.name}</Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Issues; 