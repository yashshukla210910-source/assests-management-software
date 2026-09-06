const express = require('express');
const prisma = require('../utils/prisma');
const { success, error, paginate } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

/**
 * @route GET /api/v1/users
 * @desc List users (admin/manager only)
 */
router.get('/', requireAuth, requirePermission('identity.read'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true, email: true, name: true, organization: true, status: true,
          lastLoginAt: true, createdAt: true,
          userRoles: {
            where: { revokedAt: null },
            include: { role: { select: { name: true, displayName: true } } }
          },
          dids: { select: { did: true, status: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    return paginate(res, users, page, limit, total);
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/v1/users/me
 * @desc Get current user profile
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, name: true, organization: true, status: true,
        lastLoginAt: true, createdAt: true,
        userRoles: {
          where: { revokedAt: null },
          include: { role: { select: { name: true, displayName: true } } }
        },
        dids: { select: { did: true, status: true, createdAt: true } }
      }
    });
    if (!user) return error(res, 'User not found', 404);
    return success(res, user);
  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/v1/users/:id/assign-role
 * @desc Assign a role to a user
 */
router.post('/:id/assign-role', requireAuth, requirePermission('role.assign'), async (req, res, next) => {
  try {
    const { roleName } = req.body;
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return error(res, 'Role not found', 404);

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return error(res, 'User not found', 404);

    const existing = await prisma.userRole.findFirst({
      where: { userId: req.params.id, roleId: role.id, revokedAt: null }
    });
    if (existing) return error(res, 'User already has this role', 409);

    await prisma.userRole.create({
      data: { userId: req.params.id, roleId: role.id, assignedBy: req.user.id }
    });

    return success(res, { message: 'Role assigned successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
