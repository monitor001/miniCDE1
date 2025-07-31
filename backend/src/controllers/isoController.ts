import { Request, Response } from 'express';
import { prisma } from '../db';
// import { ApiError } from '../utils/errorHandler';
import { logActivity } from '../utils/activityLogger';

/**
 * Get ISO 19650 configuration
 * @route GET /api/iso/config
 */
export const getISOConfig = async (req: Request, res: Response) => {
  try {
    // Get document statuses
    const documentStatuses = [
      { id: 'wip', name: 'WIP', nameVi: 'Đang thực hiện', color: '#faad14', isActive: true },
      { id: 'shared', name: 'Shared', nameVi: 'Đã chia sẻ', color: '#1890ff', isActive: true },
      { id: 'published', name: 'Published', nameVi: 'Đã xuất bản', color: '#52c41a', isActive: true },
      { id: 'archived', name: 'Archived', nameVi: 'Đã lưu trữ', color: '#8c8c8c', isActive: true }
    ];

    // Get metadata fields
    const metadataFields = [
      { id: 'discipline', name: 'Discipline', nameVi: 'Chuyên ngành kỹ thuật', isRequired: true, isActive: true },
      { id: 'originator', name: 'Originator', nameVi: 'Tổ chức tạo tài liệu', isRequired: true, isActive: true },
      { id: 'zone', name: 'Zone/System', nameVi: 'Khu vực hoặc hệ thống', isRequired: false, isActive: true }
    ];

    // Get approval steps
    const approvalSteps = [
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
    ];

    // Get file naming rule
    const fileNamingRule = {
      template: '{Project}-{Originator}-{Zone}-{Level}-{Type}-{Role}-{Number}',
      example: 'ABC-XYZ-00-00-DR-A-001.pdf',
      isActive: true
    };

    res.json({
      documentStatuses,
      metadataFields,
      approvalSteps,
      fileNamingRule
    });
  } catch (error) {
    console.error('Get ISO config error:', error);
    res.status(500).json({ error: 'Failed to get ISO configuration' });
  }
};

/**
 * Update ISO 19650 configuration
 * @route PUT /api/iso/config
 */
export const updateISOConfig = async (req: Request, res: Response) => {
  try {
    const { documentStatuses, metadataFields, approvalSteps, fileNamingRule } = req.body;

    // Validate input
    if (!documentStatuses || !metadataFields || !approvalSteps || !fileNamingRule) {
      return res.status(400).json({ error: 'Missing required configuration data' });
    }

    // TODO: Save configuration to database
    // For now, we'll just log the configuration
    // Log activity
    if (req.user?.id) {
      await logActivity({
        userId: req.user.id,
        action: 'update',
        objectType: 'iso_config',
        objectId: 'system',
        description: 'Cập nhật cấu hình ISO 19650',
        notify: false
      });
    }

    res.json({ 
      message: 'ISO 19650 configuration updated successfully',
      config: { documentStatuses, metadataFields, approvalSteps, fileNamingRule }
    });
  } catch (error) {
    console.error('Update ISO config error:', error);
    res.status(500).json({ error: 'Failed to update ISO configuration' });
  }
};

/**
 * Get ISO 19650 document statuses
 * @route GET /api/iso/statuses
 */
export const getDocumentStatuses = async (req: Request, res: Response) => {
  try {
    const statuses = [
      { id: 'wip', name: 'WIP', nameVi: 'Đang thực hiện', color: '#faad14', isActive: true },
      { id: 'shared', name: 'Shared', nameVi: 'Đã chia sẻ', color: '#1890ff', isActive: true },
      { id: 'published', name: 'Published', nameVi: 'Đã xuất bản', color: '#52c41a', isActive: true },
      { id: 'archived', name: 'Archived', nameVi: 'Đã lưu trữ', color: '#8c8c8c', isActive: true }
    ];

    res.json(statuses);
  } catch (error) {
    console.error('Get document statuses error:', error);
    res.status(500).json({ error: 'Failed to get document statuses' });
  }
};

/**
 * Get ISO 19650 metadata fields
 * @route GET /api/iso/metadata-fields
 */
export const getMetadataFields = async (req: Request, res: Response) => {
  try {
    const fields = [
      { id: 'discipline', name: 'Discipline', nameVi: 'Chuyên ngành kỹ thuật', isRequired: true, isActive: true },
      { id: 'originator', name: 'Originator', nameVi: 'Tổ chức tạo tài liệu', isRequired: true, isActive: true },
      { id: 'zone', name: 'Zone/System', nameVi: 'Khu vực hoặc hệ thống', isRequired: false, isActive: true },
      { id: 'level', name: 'Level', nameVi: 'Mức độ thông tin', isRequired: false, isActive: true },
      { id: 'type', name: 'Type', nameVi: 'Loại tài liệu', isRequired: false, isActive: true },
      { id: 'role', name: 'Role', nameVi: 'Vai trò', isRequired: false, isActive: true },
      { id: 'number', name: 'Number', nameVi: 'Số thứ tự', isRequired: false, isActive: true }
    ];

    res.json(fields);
  } catch (error) {
    console.error('Get metadata fields error:', error);
    res.status(500).json({ error: 'Failed to get metadata fields' });
  }
};

/**
 * Get ISO 19650 approval steps
 * @route GET /api/iso/approval-steps
 */
export const getApprovalSteps = async (req: Request, res: Response) => {
  try {
    const steps = [
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
    ];

    res.json(steps);
  } catch (error) {
    console.error('Get approval steps error:', error);
    res.status(500).json({ error: 'Failed to get approval steps' });
  }
};

/**
 * Get ISO 19650 file naming rules
 * @route GET /api/iso/file-naming
 */
export const getFileNamingRules = async (req: Request, res: Response) => {
  try {
    const rules = {
      template: '{Project}-{Originator}-{Zone}-{Level}-{Type}-{Role}-{Number}',
      example: 'ABC-XYZ-00-00-DR-A-001.pdf',
      isActive: true
    };

    res.json(rules);
  } catch (error) {
    console.error('Get file naming rules error:', error);
    res.status(500).json({ error: 'Failed to get file naming rules' });
  }
}; 