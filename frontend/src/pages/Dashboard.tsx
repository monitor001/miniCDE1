import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, List, Avatar } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ProjectOutlined, ArrowUpOutlined, UploadOutlined, DownloadOutlined, EyeOutlined, CommentOutlined, FileOutlined } from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import moment from 'moment';
import io from 'socket.io-client';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { useSelector } from 'react-redux';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [projectStats, setProjectStats] = useState({ total: 0, inProgress: 0, completed: 0, overdue: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectStatusData, setProjectStatusData] = useState<any>({});
  const [documentStats, setDocumentStats] = useState<any>({});
  const isDarkMode = useSelector((state: any) => state.ui.theme === 'dark' || (state.ui.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Lấy danh sách dự án
      const projectsRes = await axiosInstance.get('/projects?limit=1000');
      const projects = projectsRes.data.projects || projectsRes.data;
      const now = new Date();
      let inProgress = 0, completed = 0, overdue = 0;
      let statusCount: any = {};
      projects.forEach((p: any) => {
        statusCount[p.status] = (statusCount[p.status] || 0) + 1;
        if (p.status === 'ACTIVE' || p.status === 'PLANNING' || p.status === 'ON_HOLD') inProgress++;
        if (p.status === 'COMPLETED') completed++;
        if ((p.status !== 'COMPLETED') && p.endDate && new Date(p.endDate) < now) overdue++;
      });
      setProjectStats({ total: projects.length, inProgress, completed, overdue });
      setProjectStatusData({
        labels: Object.keys(statusCount),
        datasets: [{
          label: 'Số lượng dự án',
          data: Object.values(statusCount),
          backgroundColor: ['#1890ff', '#faad14', '#52c41a', '#ff4d4f', '#722ed1', '#13c2c2'],
        }]
      });
    } catch (e) {
      setProjectStats({ total: 0, inProgress: 0, completed: 0, overdue: 0 });
      setProjectStatusData({ labels: [], datasets: [] });
    }
    setLoading(false);
  };

  const fetchDocumentStats = async () => {
    try {
      const res = await axiosInstance.get('/documents');
      const docs = Array.isArray(res.data) ? res.data : [];
      let categoryCount: any = {};
      docs.forEach((d: any) => {
        categoryCount[d.category] = (categoryCount[d.category] || 0) + 1;
      });
      setDocumentStats({
        labels: Object.keys(categoryCount),
        datasets: [{
          label: 'Tài liệu',
          data: Object.values(categoryCount),
          backgroundColor: ['#52c41a', '#faad14', '#1890ff', '#ff4d4f', '#722ed1', '#13c2c2'],
        }]
      });
    } catch (e) {
      setDocumentStats({ labels: [], datasets: [] });
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await axiosInstance.get('/activities?limit=10');
      setActivities(res.data.logs || []);
    } catch (e) {
      console.error('Error fetching activities:', e);
    }
  };

  useEffect(() => { 
    fetchStats(); 
    fetchDocumentStats();
    fetchActivities();
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:3001');
    socket.on('activity:new', (activity: any) => {
      setActivities(prev => [activity, ...prev.slice(0, 9)]);
    });
    return () => { socket.disconnect(); };
  }, []);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'upload': return <UploadOutlined style={{ color: '#1890ff' }} />;
      case 'download': return <DownloadOutlined style={{ color: '#722ed1' }} />;
      case 'view': return <EyeOutlined style={{ color: '#8c8c8c' }} />;
      case 'comment': return <CommentOutlined style={{ color: '#52c41a' }} />;
      case 'create': return <ProjectOutlined style={{ color: '#1890ff' }} />;
      case 'update': return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'delete': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default: return <ProjectOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getActivityText = (activity: any) => {
    const actionMap: any = {
      'upload': 'Upload',
      'download': 'Downloaded',
      'view': 'Viewed',
      'comment': 'Commented on',
      'create': 'Created',
      'update': 'Updated',
      'delete': 'Deleted'
    };
    return `${actionMap[activity.action] || activity.action} - ${activity.description}`;
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ color: isDarkMode ? '#fff' : '#222', marginBottom: 24 }}>Tổng Quan Dự Án</Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}><Card style={{ background: isDarkMode ? '#223355' : '#f5faff' }}><Statistic title="Tổng Dự Án" value={projectStats.total} valueStyle={{ color: '#1890ff', fontWeight: 700 }} suffix={<ArrowUpOutlined />} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card style={{ background: isDarkMode ? '#2d2d2d' : '#fffbe6' }}><Statistic title="Đang Tiến Hành" value={projectStats.inProgress} valueStyle={{ color: '#faad14', fontWeight: 700 }} suffix={<ClockCircleOutlined />} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card style={{ background: isDarkMode ? '#1e3a2a' : '#f6ffed' }}><Statistic title="Hoàn Thành" value={projectStats.completed} valueStyle={{ color: '#52c41a', fontWeight: 700 }} suffix={<CheckCircleOutlined />} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card style={{ background: isDarkMode ? '#3a2323' : '#fff1f0' }}><Statistic title="Trễ Hạn" value={projectStats.overdue} valueStyle={{ color: '#ff4d4f', fontWeight: 700 }} suffix={<CloseCircleOutlined />} /></Card></Col>
      </Row>
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title={<span><ProjectOutlined /> Timeline Dự Án (Mini Gantt)</span>} bordered>
            {/* Mini Gantt chart giả lập */}
            <div style={{ marginBottom: 8 }}><b>Thiết Kế Nút Giao</b><div style={{ background: '#e6f7ff', borderRadius: 4, height: 8, width: '75%', margin: '4px 0' }} /></div>
            <div style={{ marginBottom: 8 }}><b>Phân Tích Cầu Vượt</b><div style={{ background: '#fffbe6', borderRadius: 4, height: 8, width: '45%', margin: '4px 0' }} /></div>
            <div style={{ marginBottom: 8 }}><b>Quy Hoạch Đô Thị</b><div style={{ background: '#fff1f0', borderRadius: 4, height: 8, width: '20%', margin: '4px 0' }} /></div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<span><ProjectOutlined /> Heatmap Hoạt Động Dự Án</span>} bordered>
            {/* Heatmap giả lập */}
            <div style={{ display: 'flex', alignItems: 'center', height: 80 }}>
              {[...Array(7)].map((_, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {[...Array(5)].map((_, j) => (
                    <div key={j} style={{ width: 16, height: 16, borderRadius: 4, margin: 2, background: `rgba(24, 144, 255, ${0.2 + 0.15 * j})` }} />
                  ))}
                  <div style={{ fontSize: 12, color: isDarkMode ? '#aaa' : '#888', marginTop: 2 }}>{['T2','T3','T4','T5','T6','T7','CN'][i]}</div>
                </div>
              ))}
              <div style={{ marginLeft: 8, fontSize: 12, color: isDarkMode ? '#aaa' : '#888' }}>Nhiều</div>
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title={<span><FileOutlined /> Phân Bổ Tài Liệu Theo Giai Đoạn CDE (ISO 19650)</span>} bordered>
            {documentStats.labels && documentStats.labels.length > 0 ? (
              <Pie data={documentStats} options={{ plugins: { legend: { position: 'bottom' } } }} height={220} />
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                Chưa có dữ liệu tài liệu
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<span><CheckCircleOutlined /> Thống Kê Workflow Phê Duyệt</span>} bordered>
            <Row gutter={16}>
              <Col span={6}><Card style={{ background: isDarkMode ? '#2d2d2d' : '#fffbe6', textAlign: 'center' }}><div>Chờ duyệt</div><div style={{ fontSize: 24, color: '#faad14', fontWeight: 700 }}>12</div></Card></Col>
              <Col span={6}><Card style={{ background: isDarkMode ? '#1e3a2a' : '#f6ffed', textAlign: 'center' }}><div>Đã duyệt</div><div style={{ fontSize: 24, color: '#52c41a', fontWeight: 700 }}>28</div></Card></Col>
              <Col span={6}><Card style={{ background: isDarkMode ? '#3a2323' : '#fff1f0', textAlign: 'center' }}><div>Từ chối</div><div style={{ fontSize: 24, color: '#ff4d4f', fontWeight: 700 }}>3</div></Card></Col>
              <Col span={6}><Card style={{ background: isDarkMode ? '#223355' : '#f0f5ff', textAlign: 'center' }}><div>Gửi lại</div><div style={{ fontSize: 24, color: '#1890ff', fontWeight: 700 }}>5</div></Card></Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 