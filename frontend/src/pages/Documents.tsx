import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Table, Button, Tag, Upload, message, Space, Popconfirm, Modal, Form, Input, Select, Tooltip, Drawer, List, DatePicker } from 'antd';
import { UploadOutlined, DownloadOutlined, HistoryOutlined, RollbackOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined, FileUnknownOutlined } from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import io from 'socket.io-client';
import debounce from 'lodash.debounce';
import moment from 'moment';

const statusColors: any = {
  'Đã phê duyệt': 'green',
  'Chưa phê duyệt': 'orange',
};

const fileIcon = (url: string) => {
  if (url.endsWith('.pdf')) return <FilePdfOutlined style={{ color: 'red' }} />;
  if (url.endsWith('.docx')) return <FileWordOutlined style={{ color: '#1890ff' }} />;
  if (url.endsWith('.xlsx')) return <FileExcelOutlined style={{ color: 'green' }} />;
  if (url.match(/\.(jpg|jpeg|png)$/)) return <FileImageOutlined style={{ color: '#faad14' }} />;
  return <FileUnknownOutlined />;
};

const categoryOptions = [
  { value: 'Hồ sơ thiết kế', label: 'Hồ sơ thiết kế' },
  { value: 'Hồ sơ nghiệm thu', label: 'Hồ sơ nghiệm thu' },
  { value: 'Hợp đồng', label: 'Hợp đồng' },
  { value: 'Khác', label: 'Khác' },
];

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [form] = Form.useForm();
  const outletContext = useOutletContext<{ role?: string }>() || {};
  const role = outletContext.role || '';
  const [fileUrl, setFileUrl] = useState('');
  const [filter, setFilter] = useState({ name: '', status: '', category: '', createdAt: null });
  const [historyDrawer, setHistoryDrawer] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyDocId, setHistoryDocId] = useState<string>('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/documents');
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Lỗi fetchDocuments:', e);
      message.error('Không thể tải danh sách tài liệu!');
      setDocuments([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
    const socket = io('/');
    const showRealtimeToast = debounce((msg: string) => message.info(msg), 1000, { leading: true, trailing: false });
    const showApprovedToast = debounce((msg: string) => message.success(msg), 1000, { leading: true, trailing: false });
    socket.on('document:new', (doc: any) => {
      showRealtimeToast('Có tài liệu mới: ' + doc.name);
      fetchDocuments();
    });
    socket.on('document:approved', (doc: any) => {
      showApprovedToast('Tài liệu đã được phê duyệt: ' + doc.name);
      fetchDocuments();
    });
    return () => { socket.disconnect(); };
  }, []);

  const handleDelete = async (id: string) => {
    await axiosInstance.delete(`/documents/${id}`);
    message.success('Đã xóa tài liệu');
    fetchDocuments();
  };

  const handleAdd = () => {
    setEditingDoc(null);
    form.resetFields();
    setFileUrl('');
    setModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('Submit document values:', values);
      
      // Kiểm tra các trường bắt buộc
      if (!values.name) {
        message.error('Vui lòng nhập tên tài liệu!');
        return;
      }
      
      if (!values.category) {
        message.error('Vui lòng chọn phân loại!');
        return;
      }
      
      if (!values.uploaderId) {
        message.error('Vui lòng nhập ID người tải lên!');
        return;
      }
      
      if (!values.status) {
        message.error('Vui lòng chọn trạng thái!');
        return;
      }
      
      if (!fileUrl) {
        message.error('Vui lòng tải lên file!');
        return;
      }
      
      await axiosInstance.post('/documents', { ...values, url: fileUrl });
      message.success('Đã thêm tài liệu');
      setModalOpen(false);
      fetchDocuments();
    } catch (e: any) {
      console.error('Error in handleOk:', e);
      message.error(e?.response?.data?.error || e?.message || JSON.stringify(e));
    }
  };

  const uploadProps = {
    name: 'file',
    action: `${axiosInstance.defaults.baseURL}/documents/upload`,
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    onChange(info: any) {
      if (info.file.status === 'done') {
        setFileUrl(info.file.response.url);
        message.success('Tải lên thành công!');
      } else if (info.file.status === 'error') {
        message.error('Tải lên thất bại!');
      }
    },
    showUploadList: false,
  };

  const fetchHistory = async (id: string) => {
    setHistoryDocId(id);
    setHistoryDrawer(true);
    const res = await axiosInstance.get(`/documents/${id}/history`);
    setHistoryList(Array.isArray(res.data) ? res.data : []);
  };
  const handleRestore = async (historyId: string) => {
    await axiosInstance.post(`/documents/${historyDocId}/restore`, { id: historyDocId, historyId });
    message.success('Khôi phục phiên bản thành công!');
    setHistoryDrawer(false);
    fetchDocuments();
  };

  const filteredDocs = Array.isArray(documents) ? documents.filter(doc =>
    (!filter.name || doc.name.toLowerCase().includes(filter.name.toLowerCase())) &&
    (!filter.status || doc.status === filter.status) &&
    (!filter.category || doc.category === filter.category) &&
    (!filter.createdAt || moment(doc.createdAt).isSame(filter.createdAt, 'day'))
  ) : [];
  const columns = [
    { title: '', dataIndex: 'url', key: 'icon', render: (url: string) => fileIcon(url) },
    { title: 'Tên tài liệu', dataIndex: 'name', key: 'name' },
    { title: 'Phân loại', dataIndex: 'category', key: 'category' },
    { title: 'Ngày tải lên', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
    { title: 'Người tải lên', dataIndex: ['uploader', 'name'], key: 'uploader', render: (name: string) => name || '-' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={statusColors[status] || 'default'}>{status}</Tag> },
    {
      title: 'Hành động', key: 'action', render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Tải xuống"><Button icon={<DownloadOutlined />} href={record.url} target="_blank" /></Tooltip>
          <Tooltip title="Lịch sử"><Button icon={<HistoryOutlined />} onClick={() => fetchHistory(record.id)} /></Tooltip>
          <Popconfirm title="Xóa tài liệu này?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const dragUploadProps = {
    ...uploadProps,
    multiple: false,
    showUploadList: true,
    beforeUpload: (file: File) => {
      const isAllowed = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
      ].includes(file.type);
      if (!isAllowed) {
        message.error('Chỉ cho phép file PDF, DOCX, XLSX, JPG, PNG!');
        return Upload.LIST_IGNORE;
      }
      if (file.size > 10 * 1024 * 1024) {
        message.error('Dung lượng tối đa 10MB!');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Input placeholder="Tìm tên tài liệu" style={{ width: 200 }} value={filter.name} onChange={e => setFilter(f => ({ ...f, name: e.target.value }))} />
        <Select placeholder="Trạng thái" style={{ width: 150 }} allowClear value={filter.status || undefined} onChange={v => setFilter(f => ({ ...f, status: v || '' }))} options={['Đã phê duyệt', 'Chưa phê duyệt'].map(s => ({ value: s, label: s }))} />
        <Select placeholder="Phân loại" style={{ width: 180 }} allowClear value={filter.category || undefined} onChange={v => setFilter(f => ({ ...f, category: v || '' }))} options={categoryOptions} />
        <DatePicker placeholder="Ngày tải lên" style={{ width: 140 }} value={filter.createdAt} onChange={d => setFilter(f => ({ ...f, createdAt: d }))} />
        <Button onClick={() => setFilter({ name: '', status: '', category: '', createdAt: null })}>Xóa lọc</Button>
        <Button type="primary" onClick={handleAdd}>Tải lên tài liệu</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={filteredDocs} loading={loading} bordered />
      <Modal open={modalOpen} title="Tải lên tài liệu" onOk={handleOk} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên tài liệu" rules={[{ required: true, message: 'Nhập tên tài liệu!' }]}> <Input /> </Form.Item>
          <Form.Item name="category" label="Phân loại" rules={[{ required: true, message: 'Chọn phân loại!' }]}> <Select options={categoryOptions} /> </Form.Item>
          <Form.Item label="Tải file lên">
            <Upload.Dragger {...dragUploadProps} style={{ padding: 8 }}>
              <p className="ant-upload-drag-icon"><UploadOutlined /></p>
              <p>Kéo & thả hoặc bấm để chọn file</p>
            </Upload.Dragger>
            {fileUrl && <a href={fileUrl} target="_blank" rel="noopener noreferrer">Xem file đã tải lên</a>}
          </Form.Item>
          <Form.Item name="uploaderId" label="Người tải lên" rules={[{ required: true, message: 'Nhập ID người tải lên!' }]}> <Input /> </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Chọn trạng thái!' }]}> <Select options={[{ value: 'Đã phê duyệt', label: 'Đã phê duyệt' }, { value: 'Chưa phê duyệt', label: 'Chưa phê duyệt' }]} /> </Form.Item>
        </Form>
      </Modal>
      <Drawer open={historyDrawer} onClose={() => setHistoryDrawer(false)} title="Lịch sử tài liệu" width={480}>
        <List
          dataSource={historyList}
          renderItem={item => (
            <List.Item actions={[<Button icon={<RollbackOutlined />} onClick={() => handleRestore(item.id)} size="small">Khôi phục</Button>]}> 
              <List.Item.Meta
                title={<span>{item.name} (v{item.version})</span>}
                description={<span>{item.action} bởi {item.userId} lúc {new Date(item.createdAt).toLocaleString()}</span>}
              />
              <a href={item.url} target="_blank" rel="noopener noreferrer">Xem file</a>
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
};

export default Documents; 