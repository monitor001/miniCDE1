import React, { useEffect, useState } from 'react';
import { Table, Card, message } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import axiosInstance from '../axiosConfig';

const ActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/activity-logs');
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setLogs([]);
      message.error('Không thể tải nhật ký hoạt động');
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend' as SortOrder,
    },
    {
      title: 'Người dùng',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => user?.name || user?.email || 'Ẩn danh',
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Đối tượng',
      dataIndex: 'objectType',
      key: 'objectType',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => <span style={{ whiteSpace: 'pre-wrap' }}>{desc}</span>,
    },
  ];

  // Sửa lỗi linter: defaultSortOrder phải là đúng kiểu SortOrder
  columns[0].defaultSortOrder = 'descend';

  return (
    <div style={{ padding: 24 }}>
      <Card title="Nhật ký hoạt động người dùng" bordered>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={Array.isArray(logs) ? logs : []}
          loading={loading}
          bordered
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
};

export default ActivityLog; 