import React, { useEffect, useState } from 'react';
import { Tag, Tooltip } from 'antd';
import axios from 'axios';

interface DocumentStatus {
  id: string;
  name: string;
  nameVi: string;
  color: string;
  isActive: boolean;
}

interface ISOStatusBadgeProps {
  status: string;
  showTooltip?: boolean;
}

const ISOStatusBadge: React.FC<ISOStatusBadgeProps> = ({ 
  status, 
  showTooltip = true 
}) => {
  const [statusConfig, setStatusConfig] = useState<DocumentStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatusConfig();
  }, [status]);

  const fetchStatusConfig = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/iso/statuses');
      const statuses = response.data;
      const foundStatus = statuses.find((s: DocumentStatus) => 
        s.id === status || s.name === status || s.nameVi === status
      );
      setStatusConfig(foundStatus || null);
    } catch (error) {
      console.error('Error fetching status config:', error);
    }
    setLoading(false);
  };

  // Fallback status mapping if API fails
  const getFallbackStatus = () => {
    const statusMap: { [key: string]: { nameVi: string; color: string } } = {
      'wip': { nameVi: 'Đang thực hiện', color: '#faad14' },
      'WIP': { nameVi: 'Đang thực hiện', color: '#faad14' },
      'WORK_IN_PROGRESS': { nameVi: 'Đang thực hiện', color: '#faad14' },
      'shared': { nameVi: 'Đã chia sẻ', color: '#1890ff' },
      'SHARED': { nameVi: 'Đã chia sẻ', color: '#1890ff' },
      'published': { nameVi: 'Đã xuất bản', color: '#52c41a' },
      'PUBLISHED': { nameVi: 'Đã xuất bản', color: '#52c41a' },
      'archived': { nameVi: 'Đã lưu trữ', color: '#8c8c8c' },
      'ARCHIVED': { nameVi: 'Đã lưu trữ', color: '#8c8c8c' }
    };

    return statusMap[status] || { nameVi: status, color: '#d9d9d9' };
  };

  if (loading) {
    return <Tag color="#d9d9d9">Đang tải...</Tag>;
  }

  const displayStatus = statusConfig || getFallbackStatus();
  const badge = (
    <Tag color={displayStatus.color}>
      {displayStatus.nameVi}
    </Tag>
  );

  if (showTooltip) {
    return (
      <Tooltip title={`Trạng thái: ${displayStatus.nameVi}`}>
        {badge}
      </Tooltip>
    );
  }

  return badge;
};

export default ISOStatusBadge; 