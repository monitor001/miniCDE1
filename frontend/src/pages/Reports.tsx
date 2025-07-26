import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Card, Select } from 'antd';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const { Option } = Select;

const Reports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [stats, setStats] = useState<any>({});
  const [chartType, setChartType] = useState('all');

  const fetchReports = async () => {
    setLoading(true);
    const res = await axios.get('/api/reports');
    setReports(res.data as any[]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const res = await axios.get('/api/reports/stats');
    setStats(res.data);
  };

  useEffect(() => { fetchReports(); fetchStats(); }, []);

  const handleAdd = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await axios.post('/api/reports', values);
      message.success('Đã tạo báo cáo');
      setModalOpen(false);
      fetchReports();
    } catch (e: any) {
      message.error(e?.response?.data?.error || e?.message || JSON.stringify(e));
    }
  };

  const columns = [
    { title: 'Loại báo cáo', dataIndex: 'type', key: 'type' },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
    { title: 'Dữ liệu', dataIndex: 'data', key: 'data', render: (data: any) => <pre style={{ maxWidth: 200, whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre> },
  ];

  // Demo chart data
  const chartData = {
    labels: ['Công việc', 'Tài liệu', 'Người dùng'],
    datasets: [
      {
        label: 'Số lượng',
        data: [stats.taskCount || 0, stats.documentCount || 0, stats.userCount || 0],
        backgroundColor: ['#1890ff', '#52c41a', '#faad14'],
      },
    ],
  };

  return (
    <div style={{ padding: 24 }}>
      <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>Tạo báo cáo</Button>
      <Table rowKey="id" columns={columns} dataSource={reports} loading={loading} bordered style={{ marginBottom: 32 }} />
      <Card title="Biểu đồ thống kê" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Select value={chartType} onChange={setChartType} style={{ width: 200 }}>
            <Option value="all">Tất cả</Option>
            <Option value="task">Công việc</Option>
            <Option value="document">Tài liệu</Option>
            <Option value="user">Người dùng</Option>
          </Select>
        </div>
        <Bar data={{
          labels: chartType === 'all' ? ['Công việc', 'Tài liệu', 'Người dùng'] : [chartType === 'task' ? 'Công việc' : chartType === 'document' ? 'Tài liệu' : 'Người dùng'],
          datasets: [
            {
              label: 'Số lượng',
              data: chartType === 'all' ? [stats.taskCount || 0, stats.documentCount || 0, stats.userCount || 0] : [chartType === 'task' ? stats.taskCount : chartType === 'document' ? stats.documentCount : stats.userCount],
              backgroundColor: chartType === 'all' ? ['#1890ff', '#52c41a', '#faad14'] : [chartType === 'task' ? '#1890ff' : chartType === 'document' ? '#52c41a' : '#faad14'],
            },
          ],
        }} />
      </Card>
      <Modal open={modalOpen} title="Tạo báo cáo" onOk={handleOk} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="Loại báo cáo" rules={[{ required: true, message: 'Nhập loại báo cáo!' }]}> <Input /> </Form.Item>
          <Form.Item name="data" label="Dữ liệu (JSON)" rules={[{ required: true, message: 'Nhập dữ liệu!' }]}> <Input.TextArea /> </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Reports; 