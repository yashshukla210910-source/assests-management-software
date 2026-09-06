const { error } = require('../utils/response');
const prisma = require('../utils/prisma');

/**
 * RBAC Middleware.
 * Checks if the authenticated user has the required permission via their assigned roles.
 */
const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return error(res, 'Authentication required', 401, 'UNAUTHORIZED');
      }

      // If user has admin role, bypass permission check
      if (req.user.roles.includes('admin')) {
        return next();
      }

      // Check specific permission
      const userRoles = await prisma.userRole.findMany({
        where: { userId: req.user.id, revokedAt: null },
        include: {
          role: {
            include: {
              permissions: {
                where: { granted: true },
                include: { permission: true }
              }
            }
          }
        }
      });

      let hasPermission = false;
      for (const ur of userRoles) {
        const hasIt = ur.role.permissions.some(rp => rp.permission.key === requiredPermission);
        if (hasIt) {
          hasPermission = true;
          break;
        }
      }

      if (!hasPermission) {
        return error(res, `Missing required permission: ${requiredPermission}`, 403, 'INSUFFICIENT_PERMISSIONS');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { requirePermission };
