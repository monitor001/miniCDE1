import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Row, Col, Typography, Divider } from 'antd';
import axiosInstance from '../axiosConfig';

const { Title, Text } = Typography;
const { Option } = Select;

interface MetadataField {
  id: string;
  name: string;
  nameVi: string;
  isRequired: boolean;
  isActive: boolean;
}

interface ISOMetadataFormProps {
  form: any;
  initialValues?: any;
  showTitle?: boolean;
}

const ISOMetadataForm: React.FC<ISOMetadataFormProps> = ({ 
  form, 
  initialValues = {}, 
  showTitle = true 
}) => {
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMetadataFields();
  }, []);

  const fetchMetadataFields = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/iso/metadata-fields');
      setMetadataFields(response.data);
    } catch (error) {
      console.error('Error fetching metadata fields:', error);
    }
    setLoading(false);
  };

  const renderField = (field: MetadataField) => {
    const fieldName = `metadata.${field.id}`;
    
    // Predefined options for certain fields
    const getFieldOptions = () => {
      switch (field.id) {
        case 'discipline':
          return [
            { value: 'AR', label: 'AR - Kiến trúc' },
            { value: 'ST', label: 'ST - Kết cấu' },
            { value: 'ME', label: 'ME - Cơ điện' },
            { value: 'PL', label: 'PL - Quy hoạch' },
            { value: 'LD', label: 'LD - Cảnh quan' },
            { value: 'QS', label: 'QS - Định giá' },
            { value: 'PM', label: 'PM - Quản lý dự án' }
          ];
        case 'type':
          return [
            { value: 'DR', label: 'DR - Bản vẽ' },
            { value: 'SP', label: 'SP - Đặc tả' },
            { value: 'SK', label: 'SK - Báo cáo khảo sát' },
            { value: 'CA', label: 'CA - Tính toán' },
            { value: 'RP', label: 'RP - Báo cáo' },
            { value: 'CO', label: 'CO - Hợp đồng' },
            { value: 'OT', label: 'OT - Khác' }
          ];
        case 'level':
          return [
            { value: '00', label: '00 - Khái niệm' },
            { value: '10', label: '10 - Thiết kế sơ bộ' },
            { value: '20', label: '20 - Thiết kế chi tiết' },
            { value: '30', label: '30 - Thiết kế thi công' },
            { value: '40', label: '40 - Thiết kế hoàn thiện' },
            { value: '50', label: '50 - Thiết kế vận hành' }
          ];
        case 'role':
          return [
            { value: 'A', label: 'A - Tác giả' },
            { value: 'C', label: 'C - Kiểm tra' },
            { value: 'R', label: 'R - Phê duyệt' },
            { value: 'I', label: 'I - Thông tin' }
          ];
        default:
          return [];
      }
    };

    const options = getFieldOptions();

    return (
      <Col span={12} key={field.id}>
        <Form.Item
          name={fieldName}
          label={
            <span>
              {field.nameVi}
              {field.isRequired && <span style={{ color: 'red' }}> *</span>}
            </span>
          }
          rules={field.isRequired ? [{ required: true, message: `${field.nameVi} là bắt buộc!` }] : []}
          initialValue={initialValues[field.id]}
        >
          {options.length > 0 ? (
            <Select
              placeholder={`Chọn ${field.nameVi.toLowerCase()}`}
              showSearch
              optionFilterProp="label"
            >
              {options.map(option => (
                <Option key={option.value} value={option.value} label={option.label}>
                  {option.label}
                </Option>
              ))}
            </Select>
          ) : (
            <Input placeholder={`Nhập ${field.nameVi.toLowerCase()}`} />
          )}
        </Form.Item>
      </Col>
    );
  };

  if (loading) {
    return <div>Đang tải metadata fields...</div>;
  }

  return (
    <div>
      {showTitle && (
        <>
          <Title level={5}>Metadata ISO 19650</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Thông tin metadata theo tiêu chuẩn ISO 19650
          </Text>
          <Divider />
        </>
      )}
      
      <Row gutter={16}>
        {metadataFields
          .filter(field => field.isActive)
          .map(field => renderField(field))
        }
      </Row>
    </div>
  );
};

export default ISOMetadataForm; 