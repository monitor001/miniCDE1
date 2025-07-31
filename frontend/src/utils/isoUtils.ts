// Frontend ISO 19650 utilities

export interface ISODocumentStatus {
  id: string;
  name: string;
  nameVi: string;
  color: string;
  isActive: boolean;
}

export interface ISOMetadataField {
  id: string;
  name: string;
  nameVi: string;
  isRequired: boolean;
  isActive: boolean;
}

export interface ISOApprovalStep {
  id: string;
  name: string;
  nameVi: string;
  description: string;
  isAutomatic: boolean;
  isRequired: boolean;
  approverRole?: string;
  order: number;
}

export interface ISOFileNamingRule {
  template: string;
  example: string;
  isActive: boolean;
}

/**
 * Format document metadata for display
 */
export const formatDocumentMetadata = (metadata: any): any => {
  const formatted: any = {};
  
  // Map ISO field IDs to display names
  const fieldMappings: { [key: string]: string } = {
    discipline: 'Chuyên ngành kỹ thuật',
    originator: 'Tổ chức tạo tài liệu',
    zone: 'Khu vực hoặc hệ thống',
    level: 'Mức độ thông tin',
    type: 'Loại tài liệu',
    role: 'Vai trò',
    number: 'Số thứ tự'
  };

  for (const [key, value] of Object.entries(metadata)) {
    if (value && fieldMappings[key]) {
      formatted[fieldMappings[key]] = value;
    }
  }

  return formatted;
};

/**
 * Get field display name by ID
 */
export const getFieldDisplayName = (fieldId: string): string => {
  const fieldMappings: { [key: string]: string } = {
    discipline: 'Chuyên ngành kỹ thuật',
    originator: 'Tổ chức tạo tài liệu',
    zone: 'Khu vực hoặc hệ thống',
    level: 'Mức độ thông tin',
    type: 'Loại tài liệu',
    role: 'Vai trò',
    number: 'Số thứ tự'
  };

  return fieldMappings[fieldId] || fieldId;
};

/**
 * Get discipline display name
 */
export const getDisciplineDisplayName = (code: string): string => {
  const disciplineMap: { [key: string]: string } = {
    'AR': 'Kiến trúc',
    'ST': 'Kết cấu',
    'ME': 'Cơ điện',
    'PL': 'Quy hoạch',
    'LD': 'Cảnh quan',
    'QS': 'Định giá',
    'PM': 'Quản lý dự án'
  };

  return disciplineMap[code] || code;
};

/**
 * Get document type display name
 */
export const getDocumentTypeDisplayName = (code: string): string => {
  const typeMap: { [key: string]: string } = {
    'DR': 'Bản vẽ',
    'SP': 'Đặc tả',
    'SK': 'Báo cáo khảo sát',
    'CA': 'Tính toán',
    'RP': 'Báo cáo',
    'CO': 'Hợp đồng',
    'OT': 'Khác'
  };

  return typeMap[code] || code;
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (code: string): string => {
  const roleMap: { [key: string]: string } = {
    'A': 'Tác giả',
    'C': 'Kiểm tra',
    'R': 'Phê duyệt',
    'I': 'Thông tin'
  };

  return roleMap[code] || code;
};

/**
 * Get level display name
 */
export const getLevelDisplayName = (code: string): string => {
  const levelMap: { [key: string]: string } = {
    '00': 'Khái niệm',
    '10': 'Thiết kế sơ bộ',
    '20': 'Thiết kế chi tiết',
    '30': 'Thiết kế thi công',
    '40': 'Thiết kế hoàn thiện',
    '50': 'Thiết kế vận hành'
  };

  return levelMap[code] || code;
};

/**
 * Validate metadata on frontend
 */
export const validateMetadata = (metadata: any, requiredFields: string[] = ['discipline', 'originator']): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const fieldId of requiredFields) {
    if (!metadata[fieldId] || metadata[fieldId].trim() === '') {
      const fieldName = getFieldDisplayName(fieldId);
      errors.push(`${fieldName} là bắt buộc theo tiêu chuẩn ISO 19650`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate example filename based on template
 */
export const generateExampleFilename = (template: string, projectName: string = 'ABC'): string => {
  return template
    .replace('{Project}', projectName)
    .replace('{Originator}', 'XYZ')
    .replace('{Zone}', '00')
    .replace('{Level}', '00')
    .replace('{Type}', 'DR')
    .replace('{Role}', 'A')
    .replace('{Number}', '001') + '.pdf';
}; 