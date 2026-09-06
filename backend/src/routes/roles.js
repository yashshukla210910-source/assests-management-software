const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map(v => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return error(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors.array());
};

/**
 * @route GET /api/v1/roles
 * @desc List all roles and their permissions
 */
router.get('/', requireAuth, requirePermission('role.read'), async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true }
        },
        _count: {
          select: { userRoles: { where: { revokedAt: null } } }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Format for easier frontend consumption
    const formattedRoles = roles.map(r => ({
      id: r.id,
      name: r.name,
      displayName: r.displayName,
      description: r.description,
      isSystem: r.isSystem,
      activeUsersCount: r._count.userRoles,
      permissions: r.permissions.map(p => ({
        id: p.permission.id,
        key: p.permission.key,
        domain: p.permission.domain,
        granted: p.granted
      }))
    }));

    return success(res, formattedRoles);
  } catch (err) {
    next(err);
  }
});

/**
 * @route PATCH /api/v1/roles/:id/permissions
 * @desc Update permissions for a role
 */
router.patch('/:id/permissions', requireAuth, requirePermission('role.update'), validate([
  body('permissions').isArray().withMessage('Permissions must be an array of objects')
]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body; // Array of { permissionId, granted }

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return error(res, 'Role not found', 404);
    if (role.name === 'admin') return error(res, 'Cannot modify admin role', 403);

    // Update in transaction
    await prisma.$transaction(
      permissions.map(p => 
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: id,
              permissionId: p.permissionId
            }
          },
          update: {
            granted: p.granted,
            updatedBy: req.user.id
          },
          create: {
            roleId: id,
            permissionId: p.permissionId,
            granted: p.granted,
            updatedBy: req.user.id
          }
        })
      )
    );

    return success(res, { message: 'Permissions updated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
