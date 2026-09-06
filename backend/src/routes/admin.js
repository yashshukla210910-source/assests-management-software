const express = require('express');
const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

/**
 * @route GET /api/v1/admin/system
 * @desc Get system status and statistics
 */
router.get('/system', requireAuth, requirePermission('admin.system'), async (req, res, next) => {
  try {
    const [userCount, identityCount, assetCount, auditCount] = await Promise.all([
      prisma.user.count({ where: { status: 'active' } }),
      prisma.did.count({ where: { status: 'active' } }),
      prisma.asset.count(),
      prisma.auditEvent.count()
    ]);

    return success(res, {
      system: {
        status: 'operational',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      blockchain: {
        rpcUrl: process.env.RPC_URL,
        chainId: process.env.CHAIN_ID,
        contracts: {
          identityRegistry: process.env.IDENTITY_REGISTRY_ADDRESS,
          assetRegistry: process.env.ASSET_REGISTRY_ADDRESS,
          auditRegistry: process.env.AUDIT_REGISTRY_ADDRESS,
          accessControl: process.env.ACCESS_CONTROL_ADDRESS
        }
      },
      stats: {
        activeUsers: userCount,
        activeIdentities: identityCount,
        totalAssets: assetCount,
        totalAuditEvents: auditCount
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/v1/admin/dashboard
 * @desc Get dashboard statistics (admin only)
 */
router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const isAdmin = req.user.roles.includes('admin');
    const isManager = req.user.roles.includes('manager') || req.user.roles.includes('auditor');

    const [
      totalIdentities, activeIdentities,
      totalAssets, assignedAssets,
      totalAuditEvents, recentAuditEvents,
      unreadNotifications
    ] = await Promise.all([
      prisma.did.count(),
      prisma.did.count({ where: { status: 'active' } }),
      prisma.asset.count(),
      prisma.asset.count({ where: { status: { not: 'revoked' } } }),
      prisma.auditEvent.count(),
      prisma.auditEvent.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { name: true, email: true } } }
      }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } })
    ]);

    const formattedAuditEvents = recentAuditEvents.map(e => ({
      ...e,
      sequenceNo: e.sequenceNo.toString()
    }));

    return success(res, {
      stats: {
        totalIdentities,
        activeIdentities,
        totalAssets,
        assignedAssets,
        totalAuditEvents,
        unreadNotifications
      },
      recentActivity: formattedAuditEvents
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
