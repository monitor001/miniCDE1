import { Request, Response } from 'express';
import { prisma } from '../db';
import { logActivity } from '../utils/activityLogger';

/**
 * Get permission matrix
 * @route GET /api/settings/permissions
 */
export const getPermissionMatrix = async (req: Request, res: Response) => {
  try {
    // Mock data for demonstration
    const permissions = [
      { id: 'manage_users', name: 'Manage Users', nameVi: 'Quản lý người dùng', description: 'Thêm, sửa, xóa người dùng' },
      { id: 'manage_projects', name: 'Manage Projects', nameVi: 'Quản lý dự án', description: 'Tạo và quản lý dự án' },
      { id: 'manage_documents', name: 'Manage Documents', nameVi: 'Quản lý tài liệu', description: 'Upload, chỉnh sửa tài liệu' },
      { id: 'manage_tasks', name: 'Manage Tasks', nameVi: 'Quản lý nhiệm vụ', description: 'Tạo và phân công nhiệm vụ' },
      { id: 'manage_groups', name: 'Manage Groups', nameVi: 'Quản lý nhóm', description: 'Tạo và quản lý nhóm' },
      { id: 'system_settings', name: 'System Settings', nameVi: 'Cài đặt hệ thống', description: 'Cấu hình hệ thống' },
      { id: 'view_audit_log', name: 'View Audit Log', nameVi: 'Xem nhật ký audit', description: 'Xem lịch sử hoạt động' },
      { id: 'export_data', name: 'Export Data', nameVi: 'Xuất dữ liệu', description: 'Xuất báo cáo và dữ liệu' },
      { id: 'approve_documents', name: 'Approve Documents', nameVi: 'Phê duyệt tài liệu', description: 'Phê duyệt tài liệu' },
      { id: 'delete_data', name: 'Delete Data', nameVi: 'Xóa dữ liệu', description: 'Xóa tài liệu và dữ liệu' },
      { id: 'comment_documents', name: 'Comment Documents', nameVi: 'Bình luận tài liệu', description: 'Thêm bình luận vào tài liệu' },
      { id: 'upload_files', name: 'Upload Files', nameVi: 'Tải lên file', description: 'Upload tài liệu và file' },
      { id: 'edit_content', name: 'Edit Content', nameVi: 'Chỉnh sửa nội dung', description: 'Chỉnh sửa nội dung tài liệu' },
      { id: 'view_documents', name: 'View Documents', nameVi: 'Xem tài liệu', description: 'Xem và tải xuống tài liệu' },
      { id: 'view_projects', name: 'View Projects', nameVi: 'Xem dự án', description: 'Xem thông tin dự án' },
      { id: 'view_tasks', name: 'View Tasks', nameVi: 'Xem nhiệm vụ', description: 'Xem danh sách nhiệm vụ' }
    ];

    const roles = [
      { id: 'admin', name: 'Administrator', nameVi: 'Quản trị viên', color: 'red' },
      { id: 'project_manager', name: 'Project Manager', nameVi: 'Quản lý dự án', color: 'blue' },
      { id: 'editor', name: 'Editor', nameVi: 'Biên tập viên', color: 'green' },
      { id: 'approver', name: 'Approver', nameVi: 'Người phê duyệt', color: 'purple' },
      { id: 'viewer', name: 'Viewer', nameVi: 'Người xem', color: 'grey' }
    ];

    const permissionMatrix = {
      manage_users: { admin: true, project_manager: false, editor: false, approver: false, viewer: false },
      manage_projects: { admin: true, project_manager: true, editor: false, approver: false, viewer: false },
      manage_documents: { admin: true, project_manager: true, editor: true, approver: false, viewer: false },
      manage_tasks: { admin: true, project_manager: true, editor: true, approver: false, viewer: false },
      manage_groups: { admin: true, project_manager: false, editor: false, approver: false, viewer: false },
      system_settings: { admin: true, project_manager: false, editor: false, approver: false, viewer: false },
      view_audit_log: { admin: true, project_manager: false, editor: false, approver: false, viewer: false },
      export_data: { admin: true, project_manager: true, editor: false, approver: false, viewer: false },
      approve_documents: { admin: true, project_manager: false, editor: false, approver: true, viewer: false },
      delete_data: { admin: true, project_manager: false, editor: false, approver: false, viewer: false },
      comment_documents: { admin: true, project_manager: true, editor: true, approver: true, viewer: false },
      upload_files: { admin: true, project_manager: true, editor: true, approver: false, viewer: false },
      edit_content: { admin: true, project_manager: true, editor: true, approver: false, viewer: false },
      view_documents: { admin: true, project_manager: true, editor: true, approver: true, viewer: true },
      view_projects: { admin: true, project_manager: true, editor: true, approver: true, viewer: true },
      view_tasks: { admin: true, project_manager: true, editor: true, approver: true, viewer: true }
    };

    res.json({
      permissions,
      roles,
      permissionMatrix
    });
  } catch (error) {
    console.error('Get permission matrix error:', error);
    res.status(500).json({ error: 'Failed to get permission matrix' });
  }
};

/**
 * Update permission matrix
 * @route PUT /api/settings/permissions
 */
export const updatePermissionMatrix = async (req: Request, res: Response) => {
  try {
    const { permissions, roles, permissionMatrix } = req.body;

    // TODO: Save to database
    if (req.user?.id) {
      await logActivity({
        userId: req.user.id,
        action: 'update',
        objectType: 'permission_matrix',
        objectId: 'system',
        description: 'Cập nhật ma trận phân quyền',
        notify: false
      });
    }

    res.json({ 
      message: 'Permission matrix updated successfully',
      data: { permissions, roles, permissionMatrix }
    });
  } catch (error) {
    console.error('Update permission matrix error:', error);
    res.status(500).json({ error: 'Failed to update permission matrix' });
  }
}; 