import React from 'react';
import { Descriptions, Tag, Typography } from 'antd';
import { 
  formatDocumentMetadata, 
  getDisciplineDisplayName, 
  getDocumentTypeDisplayName, 
  getRoleDisplayName,
  getLevelDisplayName 
} from '../utils/isoUtils';

const { Text } = Typography;

interface DocumentMetadataProps {
  metadata: any;
  showTitle?: boolean;
  compact?: boolean;
}

const DocumentMetadata: React.FC<DocumentMetadataProps> = ({ 
  metadata, 
  showTitle = true,
  compact = false 
}) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return null;
  }

  const formattedMetadata = formatDocumentMetadata(metadata);

  const renderMetadataItem = (key: string, value: any) => {
    if (!value) return null;

    // Special formatting for certain fields
    const getFieldDisplay = (fieldKey: string, fieldValue: string) => {
      if (fieldKey === 'Chuyên ngành kỹ thuật') {
        return (
          <span>
            <Tag color="blue" style={{ marginRight: 4 }}>{fieldValue}</Tag>
            {getDisciplineDisplayName(fieldValue)}
          </span>
        );
      }
      
      if (fieldKey === 'Loại tài liệu') {
        return (
          <span>
            <Tag color="green" style={{ marginRight: 4 }}>{fieldValue}</Tag>
            {getDocumentTypeDisplayName(fieldValue)}
          </span>
        );
      }
      
      if (fieldKey === 'Vai trò') {
        return (
          <span>
            <Tag color="orange" style={{ marginRight: 4 }}>{fieldValue}</Tag>
            {getRoleDisplayName(fieldValue)}
          </span>
        );
      }
      
      if (fieldKey === 'Mức độ thông tin') {
        return (
          <span>
            <Tag color="purple" style={{ marginRight: 4 }}>{fieldValue}</Tag>
            {getLevelDisplayName(fieldValue)}
          </span>
        );
      }

      return fieldValue;
    };

    return (
      <Descriptions.Item key={key} label={key}>
        {getFieldDisplay(key, value)}
      </Descriptions.Item>
    );
  };

  if (compact) {
    return (
      <div>
        {showTitle && (
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Metadata ISO 19650:
          </Text>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(formattedMetadata).map(([key, value]) => {
            if (!value) return null;
            return (
              <Tag key={key} color="blue">
                {key}: {String(value)}
              </Tag>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {showTitle && (
        <Text strong style={{ display: 'block', marginBottom: 16 }}>
          Metadata ISO 19650
        </Text>
      )}
      <Descriptions 
        bordered 
        size="small" 
        column={2}
        style={{ marginBottom: 16 }}
      >
        {Object.entries(formattedMetadata).map(([key, value]) => 
          renderMetadataItem(key, value)
        )}
      </Descriptions>
    </div>
  );
};

export default DocumentMetadata; 