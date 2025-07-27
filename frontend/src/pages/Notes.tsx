import React, { useEffect, useState } from 'react';
import { Card, List, Input, Button, message, Typography, Popconfirm, Space, Tag, Drawer, Form, Select } from 'antd';
import { CommentOutlined, DeleteOutlined, PlusOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import moment from 'moment';

const { Title } = Typography;

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/dashboard/notes');
      setNotes(res.data.notes || []);
    } catch (err) {
      message.error('Không thể tải ghi chú');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axiosInstance.get('/projects');
      setProjects(res.data.projects || []);
    } catch (err) {
      message.error('Không thể tải danh sách dự án');
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchProjects();
  }, []);

  const handleDelete = async (noteId: string, projectId: string) => {
    try {
      await axiosInstance.delete(`/projects/${projectId}/notes/${noteId}`);
      message.success('Đã xóa ghi chú!');
      fetchNotes();
    } catch (err) {
      message.error('Xóa ghi chú thất bại');
    }
  };

  const openDrawer = (note: any) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      message.warning('Vui lòng nhập tiêu đề và nội dung ghi chú');
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.put(`/projects/${selectedNote.project.id}/notes/${selectedNote.id}`, {
        title: editTitle,
        content: editContent
      });
      message.success('Đã lưu ghi chú!');
      setDrawerOpen(false);
      fetchNotes();
    } catch (err) {
      message.error('Lưu ghi chú thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tw-p-6 tw-max-w-3xl tw-mx-auto">
      <Card bordered style={{ marginBottom: 24 }}>
        <Title level={4}><CommentOutlined /> Ghi chú công việc</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            value={selectedProjectId || undefined}
            onChange={setSelectedProjectId}
            placeholder="Chọn dự án"
            style={{ width: '100%' }}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              const label = typeof option?.children === 'string' ? option.children : '';
              return label.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {projects.map((p: any) => (
              <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
            ))}
          </Select>
          {/* Đã xoá hoàn toàn mọi dòng liên quan đến newNote và handleAddNote */}
        </Space>
      </Card>
      <Card bordered>
        <List
          loading={loading}
          dataSource={notes}
          renderItem={item => (
            <List.Item
              actions={[
                <Popconfirm
                  title="Xóa ghi chú này?"
                  onConfirm={() => handleDelete(item.id, item.project?.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button type="link" icon={<DeleteOutlined />} danger />
                </Popconfirm>
              ]}
            >
              <div style={{ width: '100%' }}>
                <div style={{ fontWeight: 600, color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => openDrawer(item)}>
                  <EditOutlined style={{ marginRight: 6 }} />{item.title}
                </div>
                <div style={{ fontSize: 13, color: '#444', margin: '4px 0 2px 0' }}>{item.content}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  {item.project?.name && <Tag color="blue">{item.project.name}</Tag>}
                  {item.user?.name && <span> {item.user.name}</span>}
                  <span style={{ float: 'right', color: '#bbb' }}>{moment(item.createdAt).format('DD/MM/YYYY HH:mm')}</span>
                </div>
              </div>
            </List.Item>
          )}
          locale={{ emptyText: 'Chưa có ghi chú nào' }}
        />
      </Card>
      <Drawer
        title={<span><EditOutlined /> Chi tiết ghi chú</span>}
        placement="right"
        width={400}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <Button type="primary" icon={<SaveOutlined />} block loading={saving} onClick={handleSave}>
            Lưu ghi chú
          </Button>
        }
      >
        <Form layout="vertical">
          <Form.Item label="Tiêu đề">
            <Input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              maxLength={100}
            />
          </Form.Item>
          <Form.Item label="Nội dung">
            <Input.TextArea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={6}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Notes; 