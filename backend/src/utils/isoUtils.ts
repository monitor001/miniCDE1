import { prisma } from '../db';

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
 * Generate filename according to ISO 19650 naming convention
 */
export const generateISOName = async (
  originalName: string,
  projectId: string,
  metadata: {
    originator?: string;
    zone?: string;
    level?: string;
    type?: string;
    role?: string;
    number?: string;
  }
): Promise<string> => {
  try {
    // Get project info
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Get ISO configuration
    const isoConfig = await getISOConfiguration();
    
    if (!isoConfig.fileNamingRule.isActive) {
      return originalName;
    }

    const template = isoConfig.fileNamingRule.template;
    
    // Replace placeholders with actual values
    let filename = template
      .replace('{Project}', project.name || 'PROJECT')
      .replace('{Originator}', metadata.originator || 'ORG')
      .replace('{Zone}', metadata.zone || '00')
      .replace('{Level}', metadata.level || '00')
      .replace('{Type}', metadata.type || 'DR')
      .replace('{Role}', metadata.role || 'A')
      .replace('{Number}', metadata.number || '001');

    // Add file extension
    const ext = originalName.split('.').pop();
    if (ext) {
      filename += `.${ext}`;
    }

    return filename;
  } catch (error) {
    console.error('Error generating ISO filename:', error);
    return originalName;
  }
};

/**
 * Validate document metadata according to ISO 19650 requirements
 */
export const validateISOMetadata = async (
  metadata: any,
  requiredFields: string[] = ['discipline', 'originator']
): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  try {
    const isoConfig = await getISOConfiguration();
    
    // Check required fields
    for (const fieldId of requiredFields) {
      const field = isoConfig.metadataFields.find(f => f.id === fieldId);
      if (field && field.isRequired && (!metadata[fieldId] || metadata[fieldId].trim() === '')) {
        errors.push(`${field.nameVi} là bắt buộc theo tiêu chuẩn ISO 19650`);
      }
    }

    // Validate file naming convention if enabled
    if (isoConfig.fileNamingRule.isActive) {
      // Add validation for file naming components
      if (!metadata.originator) {
        errors.push('Originator (Tổ chức tạo tài liệu) là bắt buộc cho quy tắc đặt tên file');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('Error validating ISO metadata:', error);
    return {
      isValid: false,
      errors: ['Lỗi xác thực metadata ISO 19650']
    };
  }
};

/**
 * Get ISO 19650 configuration
 */
export const getISOConfiguration = async () => {
  // For now, return hardcoded configuration
  // TODO: Load from database or configuration file
  return {
    documentStatuses: [
      { id: 'wip', name: 'WIP', nameVi: 'Đang thực hiện', color: '#faad14', isActive: true },
      { id: 'shared', name: 'Shared', nameVi: 'Đã chia sẻ', color: '#1890ff', isActive: true },
      { id: 'published', name: 'Published', nameVi: 'Đã xuất bản', color: '#52c41a', isActive: true },
      { id: 'archived', name: 'Archived', nameVi: 'Đã lưu trữ', color: '#8c8c8c', isActive: true }
    ],
    metadataFields: [
      { id: 'discipline', name: 'Discipline', nameVi: 'Chuyên ngành kỹ thuật', isRequired: true, isActive: true },
      { id: 'originator', name: 'Originator', nameVi: 'Tổ chức tạo tài liệu', isRequired: true, isActive: true },
      { id: 'zone', name: 'Zone/System', nameVi: 'Khu vực hoặc hệ thống', isRequired: false, isActive: true }
    ],
    approvalSteps: [
      {
        id: 'create',
        name: 'Create Document',
        nameVi: 'Tạo tài liệu',
        description: 'Tài liệu được tạo với trạng thái WIP',
        isAutomatic: true,
        isRequired: true,
        order: 1
      },
      {
        id: 'internal-review',
        name: 'Internal Review',
        nameVi: 'Kiểm tra nội bộ',
        description: 'Kiểm tra chất lượng nội bộ trước khi chia sẻ',
        isAutomatic: false,
        isRequired: true,
        order: 2
      },
      {
        id: 'team-share',
        name: 'Share with Team',
        nameVi: 'Chia sẻ với team',
        description: 'Chuyển sang trạng thái Shared để team review',
        isAutomatic: false,
        isRequired: true,
        order: 3
      },
      {
        id: 'final-approval',
        name: 'Final Approval',
        nameVi: 'Phê duyệt cuối',
        description: 'Phê duyệt chính thức để Published',
        isAutomatic: false,
        isRequired: true,
        approverRole: 'Project Manager',
        order: 4
      }
    ],
    fileNamingRule: {
      template: '{Project}-{Originator}-{Zone}-{Level}-{Type}-{Role}-{Number}',
      example: 'ABC-XYZ-00-00-DR-A-001.pdf',
      isActive: true
    }
  };
};

/**
 * Get next document status according to ISO 19650 workflow
 */
export const getNextDocumentStatus = async (
  currentStatus: string,
  projectId: string
): Promise<string[]> => {
  try {
    const isoConfig = await getISOConfiguration();
    
    // Define workflow transitions
    const workflowTransitions: { [key: string]: string[] } = {
      'wip': ['shared'],
      'shared': ['published', 'wip'], // Can go back to WIP for corrections
      'published': ['archived'],
      'archived': ['wip'] // Can be reactivated
    };

    return workflowTransitions[currentStatus] || [];
  } catch (error) {
    console.error('Error getting next document status:', error);
    return [];
  }
};

/**
 * Check if user can perform status transition
 */
export const canTransitionStatus = async (
  currentStatus: string,
  targetStatus: string,
  userRole: string,
  projectId: string
): Promise<boolean> => {
  try {
    const isoConfig = await getISOConfiguration();
    const nextStatuses = await getNextDocumentStatus(currentStatus, projectId);
    
    // Check if transition is allowed
    if (!nextStatuses.includes(targetStatus)) {
      return false;
    }

    // Check role permissions for specific transitions
    if (targetStatus === 'published' && !['ADMIN', 'PROJECT_MANAGER', 'BIM_MANAGER'].includes(userRole)) {
      return false;
    }

    if (targetStatus === 'archived' && !['ADMIN', 'PROJECT_MANAGER'].includes(userRole)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking status transition permission:', error);
    return false;
  }
};

/**
 * Get required metadata fields for document
 */
export const getRequiredMetadataFields = async (): Promise<ISOMetadataField[]> => {
  try {
    const isoConfig = await getISOConfiguration();
    return isoConfig.metadataFields.filter(field => field.isRequired && field.isActive);
  } catch (error) {
    console.error('Error getting required metadata fields:', error);
    return [];
  }
};

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