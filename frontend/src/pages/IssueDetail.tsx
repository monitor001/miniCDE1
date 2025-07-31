import React, { useEffect, useState, useRef } from 'react';
import { Card, List, Input, Button, Upload, message, Avatar, Typography, Space, Tag, Tooltip, Progress, Row, Col, Divider, Badge, Statistic, Image, Modal } from 'antd';
import { 
  UploadOutlined, 
  FilePdfOutlined, 
  FileUnknownOutlined, 
  ArrowDownOutlined,
  UserOutlined,
  CalendarOutlined,
  ProjectOutlined,
  MessageOutlined,
  PaperClipOutlined,
  SendOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Title, Text } = Typography;

const socket = io(process.env.REACT_APP_SOCKET_URL || 'https://qlda.hoanglong24.com');

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  let color = '#';
  for (let i = 0; i < 3; i++) color += ('00' + ((hash >> (i * 8)) & 0xff).toString(16)).slice(-2);
  return color;
}

const IssueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [fileList, setFileList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [highlightId, setHighlightId] = useState<string|null>(null);
  const [showNewBtn, setShowNewBtn] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);
  const userId = (() => { try { return JSON.parse(localStorage.getItem('user')||'{}').id; } catch { return null; } })();

  useEffect(() => {
    fetchIssue();
    fetchComments();
    socket.on('issue:comment:created', (data: any) => {
      if (data.issueId === id) {
        setComments(prev => [...prev, data.comment]);
        setHighlightId(data.comment.id);
        if (isAtBottom()) scrollToBottom();
        else setShowNewBtn(true);
        setTimeout(() => setHighlightId(null), 2000);
      }
    });
    return () => { socket.off('issue:comment:created'); };
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const fetchIssue = async () => {
    try {
      const res = await axiosInstance.get(`/issues/${id}`);
      setIssue(res.data);
    } catch {
      message.error('Không thể tải thông tin issue!');
    }
  };
  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/issues/${id}/comments`);
      setComments(res.data);
      setTimeout(scrollToBottom, 200);
    } catch {
      message.error('Không thể tải bình luận!');
    }
    setLoading(false);
  };
  const handleSend = async () => {
    if (!comment && fileList.length === 0) return;
    if (fileList.length > 5) return message.error('Chỉ được đính kèm tối đa 5 file!');
    if (fileList.some(f => f.size > 5*1024*1024)) return message.error('Mỗi file tối đa 5MB!');
    setSubmitting(true);
    const formData = new FormData();
    formData.append('content', comment);
    fileList.forEach((file: any) => formData.append('files', file.originFileObj));
    try {
      await axiosInstance.post(`/issues/${id}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setComment('');
      setFileList([]);
      // Bình luận mới sẽ được cập nhật qua socket
    } catch {
      message.error('Không thể gửi bình luận!');
    }
    setSubmitting(false);
  };
  const scrollToBottom = () => {
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 100);
    setShowNewBtn(false);
  };
  const isAtBottom = () => {
    if (!listRef.current) return true;
    return listRef.current.scrollHeight - listRef.current.scrollTop - listRef.current.clientHeight < 60;
  };
  const handleRemoveFile = (file: any) => {
    setFileList(list => list.filter(f => f.uid !== file.uid));
  };

  // Hàm lấy icon cho từng loại file
  const getFileIcon = (mimetype: string, filename: string) => {
    if (mimetype.startsWith('image/')) {
      return <FileImageOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
    }
    if (mimetype === 'application/pdf') {
      return <FilePdfOutlined style={{ color: '#cf1322', fontSize: 20 }} />;
    }
    if (mimetype.includes('word') || mimetype.includes('document')) {
      return <FileWordOutlined style={{ color: '#1890ff', fontSize: 20 }} />;
    }
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) {
      return <FileExcelOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
    }
    if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('archive')) {
      return <FileZipOutlined style={{ color: '#fa8c16', fontSize: 20 }} />;
    }
    return <FileUnknownOutlined style={{ color: '#8c8c8c', fontSize: 20 }} />;
  };

  // Hàm format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Hàm xử lý preview ảnh
  const handlePreview = (file: any) => {
    if (file.mimetype.startsWith('image/')) {
      setPreviewImage(file.url);
      setPreviewTitle(file.originalname);
      setPreviewVisible(true);
    } else {
      // Mở file trong tab mới cho các file không phải ảnh
      window.open(file.url, '_blank');
    }
  };

  // Hàm tải về file
  const handleDownload = (file: any) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.originalname;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 16, background: '#141414', minHeight: '100vh' }}>
      {/* Header với nút quay lại */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button 
            type="text" 
            onClick={() => navigate('/issues')}
            style={{ fontSize: 16, height: 36, width: 36, borderRadius: '50%', color: '#fff' }}
          >
            ←
          </Button>
          <Title level={4} style={{ margin: 0, color: '#fff' }}>Chi tiết Vấn đề</Title>
        </div>
        <Space>
          <Badge count={comments.length} showZero>
            <Button icon={<MessageOutlined />} type="text" style={{ color: '#fff' }}>
              Bình luận ({comments.length})
            </Button>
          </Badge>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* Cột thông tin thu gọn */}
        <Col xs={24} lg={6}>
          <Card 
            title={
              <Space size="small">
                <MessageOutlined style={{ color: '#1677ff', fontSize: 14 }} />
                <span style={{ fontSize: 14, color: '#fff' }}>Thông tin</span>
              </Space>
            }
            style={{ marginBottom: 16, background: '#1f1f1f', border: '1px solid #303030' }}
            size="small"
            bodyStyle={{ padding: 16, background: '#1f1f1f' }}
          >
            {issue ? (
              <div>
                <Title level={5} style={{ marginBottom: 12, color: '#fff', fontSize: 14 }}>
                  {issue.title}
                </Title>
                
                <div style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, lineHeight: 1.4, color: '#d9d9d9' }}>
                    {issue.description || 'Không có mô tả'}
                  </Text>
                </div>

                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 12, color: '#fff' }}>Loại:</Text>
                    <Tag color="purple" style={{ fontSize: 11, padding: '2px 6px' }}>
                      {issue.type === 'ISSUE' ? 'Vấn đề' : issue.type}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 12, color: '#fff' }}>Trạng thái:</Text>
                    <Tag 
                      color={
                        issue.status === 'NEW' ? 'blue' :
                        issue.status === 'IN_PROGRESS' ? 'orange' :
                        issue.status === 'RESOLVED' ? 'green' :
                        issue.status === 'CLOSED' ? 'default' : 'red'
                      }
                      style={{ fontSize: 11, padding: '2px 6px' }}
                    >
                      {issue.status === 'NEW' ? 'Mới' :
                       issue.status === 'IN_PROGRESS' ? 'Đang xử lý' :
                       issue.status === 'RESOLVED' ? 'Đã xử lý' :
                       issue.status === 'CLOSED' ? 'Đã đóng' : issue.status}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 12, color: '#fff' }}>Ưu tiên:</Text>
                    <Tag 
                      color={issue.priority === 'HIGH' ? 'red' : issue.priority === 'MEDIUM' ? 'orange' : 'green'}
                      style={{ fontSize: 11, padding: '2px 6px' }}
                    >
                      {issue.priority === 'HIGH' ? 'Cao' :
                       issue.priority === 'MEDIUM' ? 'Trung bình' : 'Thấp'}
                    </Tag>
                  </div>
                </Space>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Progress type="circle" percent={75} size="small" />
                <div style={{ marginTop: 8, fontSize: 12, color: '#fff' }}>Đang tải...</div>
              </div>
            )}
          </Card>

          {/* Thông tin liên quan thu gọn */}
          <Card 
            title={
              <Space size="small">
                <UserOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                <span style={{ fontSize: 14, color: '#fff' }}>Liên quan</span>
              </Space>
            }
            style={{ marginBottom: 16, background: '#1f1f1f', border: '1px solid #303030' }}
            size="small"
            bodyStyle={{ padding: 16, background: '#1f1f1f' }}
          >
            {issue && (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ProjectOutlined style={{ color: '#722ed1', fontSize: 12 }} />
                  <Text strong style={{ fontSize: 12, color: '#fff' }}>Dự án:</Text>
                  <Text style={{ fontSize: 12, color: '#d9d9d9' }}>{issue.project?.name || 'Không xác định'}</Text>
                </div>

                <Divider style={{ margin: '8px 0', borderColor: '#303030' }} />

                <div>
                  <Text style={{ fontSize: 12, color: '#d9d9d9' }}>Người tạo</Text>
                  <div style={{ marginTop: 4 }}>
                    <Space>
                      <Avatar 
                        size="small" 
                        style={{ background: issue.createdBy?.name ? stringToColor(issue.createdBy.name) : '#888' }}
                      >
                        {issue.createdBy?.name?.[0] || '?'}
                      </Avatar>
                      <Text strong style={{ color: '#fff' }}>{issue.createdBy?.name || 'Ẩn danh'}</Text>
                    </Space>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserOutlined style={{ color: '#722ed1', fontSize: 12 }} />
                  <Text strong style={{ fontSize: 12, color: '#fff' }}>Giao cho:</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Avatar 
                      size="small"
                      style={{ 
                        backgroundColor: stringToColor(issue.assignee?.name || 'User'),
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 10
                      }}
                    >
                      {issue.assignee?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Text style={{ fontSize: 12, color: '#d9d9d9' }}>{issue.assignee?.name || 'Chưa gán'}</Text>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarOutlined style={{ color: '#fa8c16', fontSize: 12 }} />
                  <Text strong style={{ fontSize: 12, color: '#fff' }}>Tạo:</Text>
                  <Tooltip title={dayjs(issue.createdAt).format('DD/MM/YYYY HH:mm:ss')}>
                    <Text style={{ fontSize: 12, color: '#d9d9d9' }}>
                      {dayjs(issue.createdAt).format('DD/MM/YYYY HH:mm')} ({dayjs(issue.createdAt).fromNow()})
                    </Text>
                  </Tooltip>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarOutlined style={{ color: '#fa8c16', fontSize: 12 }} />
                  <Text strong style={{ fontSize: 12, color: '#fff' }}>Cập nhật:</Text>
                  <Tooltip title={dayjs(issue.updatedAt).format('DD/MM/YYYY HH:mm:ss')}>
                    <Text style={{ fontSize: 12, color: '#d9d9d9' }}>
                      {dayjs(issue.updatedAt).format('DD/MM/YYYY HH:mm')} ({dayjs(issue.updatedAt).fromNow()})
                    </Text>
                  </Tooltip>
                </div>
              </Space>
            )}
          </Card>
        </Col>

        {/* Cột bình luận chính - chiếm phần lớn không gian */}
        <Col xs={24} lg={18}>
          <Card 
            title={
              <Space>
                <MessageOutlined style={{ color: '#1677ff' }} />
                <span style={{ color: '#fff' }}>Bình luận</span>
                <Badge count={comments.length} showZero style={{ backgroundColor: '#1677ff' }} />
                {comments.length > 0 && (
                  <Tooltip title={dayjs(comments[comments.length - 1]?.createdAt).format('DD/MM/YYYY HH:mm:ss')}>
                    <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
                      • Mới nhất: {dayjs(comments[comments.length - 1]?.createdAt).fromNow()}
                    </Text>
                  </Tooltip>
                )}
              </Space>
            }
            bodyStyle={{ padding: 0 }}
            style={{ marginBottom: 16, background: '#1f1f1f', border: '1px solid #303030' }}
          >
            <div ref={listRef} style={{ maxHeight: 600, overflowY: 'auto', padding: 20, background: '#141414', position: 'relative' }}>
          {comments.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#d9d9d9' }}>
              <MessageOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
              <div style={{ color: '#fff' }}>Chưa có bình luận nào</div>
              <Text style={{ color: '#d9d9d9' }}>Hãy là người đầu tiên bình luận!</Text>
            </div>
          ) : (
            <List
              dataSource={comments}
              loading={loading}
              renderItem={item => {
                const isMine = item.userId === userId;
                return (
                  <List.Item
                    key={item.id}
                    style={{
                      alignItems: 'flex-start',
                      background: highlightId === item.id ? '#1a365d' : isMine ? '#1a3a1a' : '#262626',
                      borderRadius: 12,
                      margin: '12px 0',
                      padding: '16px',
                      border: highlightId === item.id ? '2px solid #1890ff' : '1px solid #404040',
                      boxShadow: highlightId === item.id ? '0 4px 12px rgba(24, 144, 255, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          size="large"
                          style={{ 
                            background: stringToColor(item.user?.name||'?'),
                            border: isMine ? '2px solid #52c41a' : '2px solid #f0f0f0'
                          }}
                        >
                          {item.user?.name?.[0] || '?'}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong style={{ color: isMine ? '#52c41a' : '#1677ff', fontSize: 14 }}>
                            {item.user?.name || 'Ẩn danh'}
                          </Text>
                                                     {isMine && <Tag color="green">Bạn</Tag>}
                          <Space size="small">
                            <Tooltip title={dayjs(item.createdAt).format('DD/MM/YYYY HH:mm:ss')}>
                              <Text style={{ fontSize: 12, color: '#d9d9d9' }}>
                                📅 {dayjs(item.createdAt).fromNow()}
                              </Text>
                            </Tooltip>
                            {item.updatedAt && item.updatedAt !== item.createdAt && (
                              <Tooltip title={`Cập nhật: ${dayjs(item.updatedAt).format('DD/MM/YYYY HH:mm:ss')}`}>
                                <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
                                  ✏️ {dayjs(item.updatedAt).fromNow()}
                                </Text>
                              </Tooltip>
                            )}
                          </Space>
                        </Space>
                      }
                      description={
                        <div style={{ marginTop: 8 }}>
                          <div style={{ 
                            fontSize: 14, 
                            lineHeight: 1.6, 
                            color: '#fff',
                            marginBottom: item.attachments?.length > 0 ? 12 : 0
                          }}>
                            {item.content}
                          </div>
                          {item.attachments && Array.isArray(item.attachments) && item.attachments.length > 0 && (
                            <div style={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: 8,
                              padding: 12,
                              background: '#2a2a2a',
                              borderRadius: 8,
                              border: '1px solid #404040'
                            }}>
                              {item.attachments.map((file: any, idx: number) => (
                                <div 
                                  key={idx}
                                  style={{
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                  }}
                                  onClick={() => handlePreview(file)}
                                >
                                  {file.mimetype.startsWith('image') ? (
                                    <div style={{ 
                                      position: 'relative',
                                      borderRadius: 8,
                                      overflow: 'hidden',
                                      border: '2px solid #fff',
                                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                      background: '#fff'
                                    }}>
                                      <img 
                                        src={file.url} 
                                        alt={file.originalname} 
                                        style={{ 
                                          width: 120, 
                                          height: 90, 
                                          objectFit: 'cover',
                                          display: 'block'
                                        }} 
                                      />
                                      <div style={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        display: 'flex',
                                        gap: 4
                                      }}>
                                        <Button 
                                          type="text" 
                                          size="small" 
                                          icon={<EyeOutlined />}
                                          style={{
                                            background: 'rgba(0, 0, 0, 0.6)',
                                            borderRadius: '50%',
                                            width: 24,
                                            height: 24,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: 'none',
                                            color: '#fff'
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePreview(file);
                                          }}
                                        />
                                        <Button 
                                          type="text" 
                                          size="small" 
                                          icon={<DownloadOutlined />}
                                          style={{
                                            background: 'rgba(0, 0, 0, 0.6)',
                                            borderRadius: '50%',
                                            width: 24,
                                            height: 24,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: 'none',
                                            color: '#fff'
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(file);
                                          }}
                                        />
                                      </div>
                                      <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
                                        padding: '4px 8px'
                                      }}>
                                        <Text style={{ 
                                          color: '#fff', 
                                          fontSize: 10,
                                          display: 'block',
                                          textOverflow: 'ellipsis',
                                          overflow: 'hidden',
                                          whiteSpace: 'nowrap'
                                        }}>
                                          {file.originalname}
                                        </Text>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      padding: '12px 16px',
                                      background: '#404040',
                                      borderRadius: 8,
                                      border: '1px solid #595959',
                                      minWidth: 200,
                                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                                    }}>
                                      {getFileIcon(file.mimetype, file.originalname)}
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <Text style={{ 
                                          fontSize: 12, 
                                          fontWeight: 500,
                                          display: 'block',
                                          textOverflow: 'ellipsis',
                                          overflow: 'hidden',
                                          whiteSpace: 'nowrap',
                                          color: '#fff'
                                        }}>
                                          {file.originalname}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#d9d9d9' }}>
                                          {formatFileSize(file.size)}
                                        </Text>
                                      </div>
                                      <Space size="small">
                                        <Button 
                                          type="text" 
                                          size="small" 
                                          icon={<EyeOutlined />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePreview(file);
                                          }}
                                        />
                                        <Button 
                                          type="text" 
                                          size="small" 
                                          icon={<DownloadOutlined />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(file);
                                          }}
                                        />
                                      </Space>
                                    </div>
                                  )}
                                </div>
                              ))}
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
          {showNewBtn && (
            <Button 
              icon={<ArrowDownOutlined />} 
              type="primary" 
              size="small" 
              style={{ 
                position: 'absolute', 
                right: 20, 
                bottom: 20, 
                zIndex: 10,
                borderRadius: 20,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }} 
              onClick={scrollToBottom}
            >
              Xem bình luận mới
            </Button>
          )}
        </div>
        
        {/* Form bình luận */}
        <div style={{ 
          borderTop: '1px solid #404040', 
          padding: 20, 
          background: '#262626',
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8
        }}>
          <div style={{ marginBottom: 12 }}>
            <TextArea
              ref={inputRef}
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Nhập bình luận của bạn..."
              style={{ 
                borderRadius: 8,
                border: '1px solid #404040',
                resize: 'none',
                background: '#1f1f1f',
                color: '#fff'
              }}
              onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
              maxLength={1000}
              showCount
            />
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <Upload
              multiple
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setFileList(fileList)}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
              maxCount={5}
              showUploadList={{ 
                showRemoveIcon: true, 
                showPreviewIcon: (file) => file.type?.startsWith('image/') || false,
                showDownloadIcon: false
              }}
              onRemove={handleRemoveFile}
                              onPreview={(file) => {
                  if (file.type?.startsWith('image/')) {
                    setPreviewImage(file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : ''));
                    setPreviewTitle(file.name);
                    setPreviewVisible(true);
                  }
                }}
              itemRender={(originNode, file, fileList, actions) => (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: '#2a2a2a',
                  borderRadius: 6,
                  border: '1px solid #404040',
                  marginBottom: 4
                }}>
                  {getFileIcon(file.type || '', file.name)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ 
                      fontSize: 12, 
                      fontWeight: 500,
                      display: 'block',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      color: '#fff'
                    }}>
                      {file.name}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#d9d9d9' }}>
                      {formatFileSize(file.size || 0)}
                    </Text>
                  </div>
                  <Space size="small">
                    {file.type?.startsWith('image/') && (
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setPreviewImage(file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : ''));
                          setPreviewTitle(file.name);
                          setPreviewVisible(true);
                        }}
                      />
                    )}
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        if (file.originFileObj) {
                          const url = URL.createObjectURL(file.originFileObj);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = file.name;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        }
                      }}
                    />
                    <Button 
                      type="text" 
                      size="small" 
                      danger
                      icon={<UploadOutlined />}
                      onClick={() => actions.remove()}
                    />
                  </Space>
                </div>
              )}
            >
              <Button 
                icon={<PaperClipOutlined />} 
                style={{ 
                  borderRadius: 6,
                  border: '1px dashed #404040',
                  background: '#1f1f1f',
                  color: '#fff'
                }}
              >
                Đính kèm file (ảnh/PDF/Doc/Excel/Zip)
              </Button>
            </Upload>
            <Text style={{ fontSize: 12, marginLeft: 8, color: '#d9d9d9' }}>
              Tối đa 5 file, mỗi file 5MB. Hỗ trợ: Ảnh, PDF, Word, Excel, Zip
            </Text>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={handleSend} 
              loading={submitting} 
              disabled={!comment && fileList.length === 0}
              style={{ 
                borderRadius: 6,
                paddingLeft: 20,
                paddingRight: 20
              }}
            >
              Gửi bình luận
            </Button>
          </div>
        </div>
      </Card>
        </Col>
      </Row>

      {/* Modal Preview Ảnh */}
      <Modal
        open={previewVisible}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#fff' }}>{previewTitle}</span>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => {
                const link = document.createElement('a');
                link.href = previewImage;
                link.download = previewTitle;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              style={{ 
                background: '#1677ff',
                borderColor: '#1677ff',
                color: '#fff'
              }}
            >
              Tải về
            </Button>
          </div>
        }
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        style={{ top: 20 }}
        bodyStyle={{ 
          textAlign: 'center',
          padding: 0,
          background: '#000'
        }}
      >
        <img
          alt={previewTitle}
          style={{ 
            width: '100%',
            maxHeight: '70vh',
            objectFit: 'contain'
          }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export default IssueDetail; 