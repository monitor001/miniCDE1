import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { prisma } from '../db';

const router = Router();

// Get ISO 19650 configuration from database
router.get('/iso/config', authMiddleware, async (req, res) => {
  try {
    // Get ISO configs from database
    const isoConfigs = await prisma.iSOConfig.findMany({
      where: { isActive: true }
    });

    // Convert to expected format
    const config: any = {};
    isoConfigs.forEach(configItem => {
      config[configItem.key] = configItem.value;
    });

    // If no configs exist, return default
    if (Object.keys(config).length === 0) {
      config.documentStatuses = [
        { id: 'wip', name: 'WIP', nameVi: 'Đang thực hiện', color: '#faad14', isActive: true },
        { id: 'shared', name: 'Shared', nameVi: 'Đã chia sẻ', color: '#1890ff', isActive: true },
        { id: 'published', name: 'Published', nameVi: 'Đã xuất bản', color: '#52c41a', isActive: true },
        { id: 'archived', name: 'Archived', nameVi: 'Đã lưu trữ', color: '#8c8c8c', isActive: true }
      ];
      config.metadataFields = [
        { id: 'discipline', name: 'Discipline', nameVi: 'Chuyên ngành kỹ thuật', isRequired: true, isActive: true },
        { id: 'originator', name: 'Originator', nameVi: 'Tổ chức tạo tài liệu', isRequired: true, isActive: true },
        { id: 'zone', name: 'Zone/System', nameVi: 'Khu vực hoặc hệ thống', isRequired: false, isActive: true }
      ];
      config.approvalSteps = [
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
      config.fileNamingRule = {
        template: '{Project}-{Originator}-{Zone}-{Level}-{Type}-{Role}-{Number}',
        example: 'ABC-XYZ-00-00-DR-A-001.pdf',
        isActive: true
      };
    }

    res.json(config);
  } catch (error) {
    console.error('Error fetching ISO config:', error);
    res.status(500).json({ error: 'Failed to fetch ISO configuration' });
  }
});

// Update ISO 19650 configuration to database
router.put('/iso/config', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { documentStatuses, metadataFields, approvalSteps, fileNamingRule } = req.body;
    
    // Save each config section to database
    const configs = [
      { key: 'documentStatuses', value: documentStatuses, description: 'Document statuses configuration' },
      { key: 'metadataFields', value: metadataFields, description: 'Metadata fields configuration' },
      { key: 'approvalSteps', value: approvalSteps, description: 'Approval steps configuration' },
      { key: 'fileNamingRule', value: fileNamingRule, description: 'File naming rule configuration' }
    ];

    for (const config of configs) {
      await prisma.iSOConfig.upsert({
        where: { key: config.key },
        update: {
          value: config.value,
          description: config.description,
          updatedById: userId
        },
        create: {
          key: config.key,
          value: config.value,
          description: config.description,
          isActive: true,
          createdById: userId,
          updatedById: userId
        }
      });
    }
    
    res.json({ message: 'ISO configuration updated successfully' });
  } catch (error) {
    console.error('Error updating ISO config:', error);
    res.status(500).json({ error: 'Failed to update ISO configuration' });
  }
});

// Get comprehensive permissions configuration (permissions + roles + matrix)
router.get('/permissions-config', authMiddleware, async (req, res) => {
  try {
    const [permissions, roles, rolePermissions] = await Promise.all([
      prisma.permission.findMany({ where: { isActive: true } }),
      prisma.userRole.findMany({ where: { isActive: true } }),
      prisma.rolePermission.findMany({
        include: {
          role: true,
          permission: true
        }
      })
    ]);

    // Build permission matrix
    const permissionMatrix: any = {};
    permissions.forEach(permission => {
      permissionMatrix[permission.code] = {};
      roles.forEach(role => {
        const rolePermission = rolePermissions.find(rp => 
          rp.roleId === role.id && rp.permissionId === permission.id
        );
        permissionMatrix[permission.code][role.code] = rolePermission?.granted || false;
      });
    });

    res.json({ permissions, roles, permissionMatrix });
  } catch (error) {
    console.error('Error fetching permissions config:', error);
    res.status(500).json({ error: 'Failed to fetch permissions configuration' });
  }
});

// ===== CRUD for Permission =====
router.get('/permissions', authMiddleware, async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { category: 'asc' }
    });
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

router.post('/permissions', authMiddleware, async (req, res) => {
  try {
    const { code, name, nameVi, description, category, isActive } = req.body;
    
    // Validate required fields
    if (!code || !name || !nameVi) {
      return res.status(400).json({ error: 'Code, name, and nameVi are required' });
    }

    // Check if code already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { code }
    });
    if (existingPermission) {
      return res.status(400).json({ error: 'Permission code already exists' });
    }

    const permission = await prisma.permission.create({
      data: { code, name, nameVi, description, category, isActive }
    });
    res.json(permission);
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({ error: 'Failed to create permission' });
  }
});

// Update permission matrix (bulk update)
router.put('/permissions', authMiddleware, async (req, res) => {
  try {
    const { permissionMatrix } = req.body;
    
    if (!permissionMatrix) {
      return res.status(400).json({ error: 'Permission matrix is required' });
    }

    // Get all permissions and roles
    const permissions = await prisma.permission.findMany({ where: { isActive: true } });
    const roles = await prisma.userRole.findMany({ where: { isActive: true } });

    // Clear all existing role permissions
    await prisma.rolePermission.deleteMany({});

    // Create new role permissions based on matrix
    const rolePermissionsToCreate = [];
    
    for (const permissionCode in permissionMatrix) {
      const permission = permissions.find(p => p.code === permissionCode);
      if (!permission) continue;

      for (const roleCode in permissionMatrix[permissionCode]) {
        const role = roles.find(r => r.code === roleCode);
        if (!role) continue;

        const granted = permissionMatrix[permissionCode][roleCode];
        if (granted) {
          rolePermissionsToCreate.push({
            roleId: role.id,
            permissionId: permission.id,
            granted: true
          });
        }
      }
    }

    // Bulk create role permissions
    if (rolePermissionsToCreate.length > 0) {
      await prisma.rolePermission.createMany({
        data: rolePermissionsToCreate
      });
    }

    res.json({ 
      message: 'Permission matrix updated successfully',
      updatedCount: rolePermissionsToCreate.length
    });
  } catch (error) {
    console.error('Error updating permission matrix:', error);
    res.status(500).json({ error: 'Failed to update permission matrix' });
  }
});

router.put('/permissions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, nameVi, description, category, isActive } = req.body;
    
    // Validate required fields
    if (!code || !name || !nameVi) {
      return res.status(400).json({ error: 'Code, name, and nameVi are required' });
    }

    // Check if code already exists for other permissions
    const existingPermission = await prisma.permission.findFirst({
      where: { code, id: { not: id } }
    });
    if (existingPermission) {
      return res.status(400).json({ error: 'Permission code already exists' });
    }

    const permission = await prisma.permission.update({
      where: { id },
      data: { code, name, nameVi, description, category, isActive }
    });
    res.json(permission);
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({ error: 'Failed to update permission' });
  }
});

router.delete('/permissions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if permission is being used
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { permissionId: id }
    });
    if (rolePermissions.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete permission that is assigned to roles' 
      });
    }

    await prisma.permission.delete({ where: { id } });
    res.json({ message: 'Permission deleted' });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({ error: 'Failed to delete permission' });
  }
});

// ===== CRUD for UserRole =====
router.get('/roles', authMiddleware, async (req, res) => {
  try {
    const roles = await prisma.userRole.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

router.post('/roles', authMiddleware, async (req, res) => {
  try {
    const { code, name, nameVi, color, description, isActive } = req.body;
    
    // Validate required fields
    if (!code || !name || !nameVi) {
      return res.status(400).json({ error: 'Code, name, and nameVi are required' });
    }

    // Check if code already exists
    const existingRole = await prisma.userRole.findUnique({
      where: { code }
    });
    if (existingRole) {
      return res.status(400).json({ error: 'Role code already exists' });
    }

    const role = await prisma.userRole.create({
      data: { code, name, nameVi, color, description, isActive }
    });
    res.json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

router.put('/roles/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, nameVi, color, description, isActive } = req.body;
    
    // Validate required fields
    if (!code || !name || !nameVi) {
      return res.status(400).json({ error: 'Code, name, and nameVi are required' });
    }

    // Check if code already exists for other roles
    const existingRole = await prisma.userRole.findFirst({
      where: { code, id: { not: id } }
    });
    if (existingRole) {
      return res.status(400).json({ error: 'Role code already exists' });
    }

    const role = await prisma.userRole.update({
      where: { id },
      data: { code, name, nameVi, color, description, isActive }
    });
    res.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

router.delete('/roles/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if role is being used
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: id }
    });
    if (rolePermissions.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete role that has assigned permissions' 
      });
    }

    await prisma.userRole.delete({ where: { id } });
    res.json({ message: 'Role deleted' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// ===== CRUD for RolePermission =====
router.get('/role-permissions', authMiddleware, async (req, res) => {
  try {
    const rolePermissions = await prisma.rolePermission.findMany({
      include: {
        role: true,
        permission: true
      }
    });
    res.json(rolePermissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

router.post('/role-permissions', authMiddleware, async (req, res) => {
  try {
    const { roleId, permissionId, granted, grantedById } = req.body;
    
    // Validate required fields
    if (!roleId || !permissionId) {
      return res.status(400).json({ error: 'RoleId and permissionId are required' });
    }

    const rolePermission = await prisma.rolePermission.create({
      data: { roleId, permissionId, granted, grantedById }
    });
    res.json(rolePermission);
  } catch (error) {
    console.error('Error creating role permission:', error);
    res.status(500).json({ error: 'Failed to create role permission' });
  }
});

router.put('/role-permissions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId, permissionId, granted, grantedById } = req.body;
    
    // Validate required fields
    if (!roleId || !permissionId) {
      return res.status(400).json({ error: 'RoleId and permissionId are required' });
    }

    const rolePermission = await prisma.rolePermission.update({
      where: { id },
      data: { roleId, permissionId, granted, grantedById }
    });
    res.json(rolePermission);
  } catch (error) {
    console.error('Error updating role permission:', error);
    res.status(500).json({ error: 'Failed to update role permission' });
  }
});

router.delete('/role-permissions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.rolePermission.delete({ where: { id } });
    res.json({ message: 'Role permission deleted' });
  } catch (error) {
    console.error('Error deleting role permission:', error);
    res.status(500).json({ error: 'Failed to delete role permission' });
  }
});

// ===== CRUD for ISOConfig =====
router.get('/iso-configs', authMiddleware, async (req, res) => {
  try {
    const isoConfigs = await prisma.iSOConfig.findMany({
      orderBy: { key: 'asc' }
    });
    res.json(isoConfigs);
  } catch (error) {
    console.error('Error fetching ISO configs:', error);
    res.status(500).json({ error: 'Failed to fetch ISO configs' });
  }
});

router.post('/iso-configs', authMiddleware, async (req, res) => {
  try {
    const { key, value, description, isActive, createdById, updatedById } = req.body;
    
    // Validate required fields
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    // Check if key already exists
    const existingConfig = await prisma.iSOConfig.findUnique({
      where: { key }
    });
    if (existingConfig) {
      return res.status(400).json({ error: 'Config key already exists' });
    }

    const isoConfig = await prisma.iSOConfig.create({
      data: { key, value, description, isActive, createdById, updatedById }
    });
    res.json(isoConfig);
  } catch (error) {
    console.error('Error creating ISO config:', error);
    res.status(500).json({ error: 'Failed to create ISO config' });
  }
});

router.put('/iso-configs/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { key, value, description, isActive, createdById, updatedById } = req.body;
    
    // Validate required fields
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    // Check if key already exists for other configs
    const existingConfig = await prisma.iSOConfig.findFirst({
      where: { key, id: { not: id } }
    });
    if (existingConfig) {
      return res.status(400).json({ error: 'Config key already exists' });
    }

    const isoConfig = await prisma.iSOConfig.update({
      where: { id },
      data: { key, value, description, isActive, createdById, updatedById }
    });
    res.json(isoConfig);
  } catch (error) {
    console.error('Error updating ISO config:', error);
    res.status(500).json({ error: 'Failed to update ISO config' });
  }
});

router.delete('/iso-configs/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.iSOConfig.delete({ where: { id } });
    res.json({ message: 'ISO config deleted' });
  } catch (error) {
    console.error('Error deleting ISO config:', error);
    res.status(500).json({ error: 'Failed to delete ISO config' });
  }
});

// ===== CRUD for SystemSetting =====
router.get('/system-settings', authMiddleware, async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { category: 'asc' }
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

router.post('/system-settings', authMiddleware, async (req, res) => {
  try {
    const { key, value, description, category, isActive, createdById, updatedById } = req.body;
    
    // Validate required fields
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    // Check if key already exists
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    if (existingSetting) {
      return res.status(400).json({ error: 'Setting key already exists' });
    }

    const setting = await prisma.systemSetting.create({
      data: { key, value, description, category, isActive, createdById, updatedById }
    });
    res.json(setting);
  } catch (error) {
    console.error('Error creating system setting:', error);
    res.status(500).json({ error: 'Failed to create system setting' });
  }
});

router.put('/system-settings/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { key, value, description, category, isActive, createdById, updatedById } = req.body;
    
    // Validate required fields
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    // Check if key already exists for other settings
    const existingSetting = await prisma.systemSetting.findFirst({
      where: { key, id: { not: id } }
    });
    if (existingSetting) {
      return res.status(400).json({ error: 'Setting key already exists' });
    }

    const setting = await prisma.systemSetting.update({
      where: { id },
      data: { key, value, description, category, isActive, createdById, updatedById }
    });
    res.json(setting);
  } catch (error) {
    console.error('Error updating system setting:', error);
    res.status(500).json({ error: 'Failed to update system setting' });
  }
});

router.delete('/system-settings/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.systemSetting.delete({ where: { id } });
    res.json({ message: 'System setting deleted' });
  } catch (error) {
    console.error('Error deleting system setting:', error);
    res.status(500).json({ error: 'Failed to delete system setting' });
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organization: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { name, email } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organization: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { oldPassword, newPassword } = req.body;

    // Validate required fields
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify old password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Mật khẩu cũ không đúng' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router; 