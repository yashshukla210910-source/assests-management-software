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
    const isGlobal = isAdmin || isManager;

    const didWhere = isGlobal ? {} : { userId: req.user.id };
    const assetWhere = isGlobal ? {} : { 
      OR: [
        { createdBy: req.user.id },
        { ownershipRecords: { some: { ownerUserId: req.user.id, isCurrent: true } } }
      ]
    };
    const auditWhere = isGlobal ? {} : { actorUserId: req.user.id };

    const [
      totalIdentities, activeIdentities,
      totalAssets, assignedAssets,
      totalAuditEvents, recentAuditEvents,
      unreadNotifications
    ] = await Promise.all([
      prisma.did.count({ where: didWhere }),
      prisma.did.count({ where: { ...didWhere, status: 'active' } }),
      prisma.asset.count({ where: assetWhere }),
      prisma.asset.count({ where: { ...assetWhere, status: { not: 'revoked' } } }),
      prisma.auditEvent.count({ where: auditWhere }),
      prisma.auditEvent.findMany({
        where: auditWhere,
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

/**
 * @route GET /api/v1/admin/dashboard-charts
 * @desc Get chart data for dashboard (categories, roles, status breakdown)
 */
router.get('/dashboard-charts', requireAuth, async (req, res, next) => {
  try {
    const isAdmin = req.user.roles.includes('admin');
    const isManager = req.user.roles.includes('manager') || req.user.roles.includes('auditor');
    const isGlobal = isAdmin || isManager;

    const didWhere = isGlobal ? {} : { userId: req.user.id };
    const assetWhere = isGlobal ? {} : { 
      OR: [
        { createdBy: req.user.id },
        { ownershipRecords: { some: { ownerUserId: req.user.id, isCurrent: true } } }
      ]
    };
    const auditWhere = isGlobal ? {} : { actorUserId: req.user.id };

    // Assets by category
    const assetsByCategoryRaw = await prisma.asset.groupBy({
      by: ['category'],
      where: assetWhere,
      _count: { id: true }
    });
    const assetsByCategory = assetsByCategoryRaw.map(r => ({
      category: r.category || 'uncategorized',
      count: r._count.id
    }));

    // Identities by status
    const identitiesByStatusRaw = await prisma.did.groupBy({
      by: ['status'],
      where: didWhere,
      _count: { id: true }
    });
    const identitiesByStatus = identitiesByStatusRaw.map(r => ({
      status: r.status,
      count: r._count.id
    }));

    // Users by role (Only show if global)
    let usersByRole = [];
    if (isGlobal) {
      const usersByRoleRaw = await prisma.userRole.groupBy({
        by: ['roleId'],
        _count: { userId: true },
        where: { revokedAt: null }
      });
      const roles = await prisma.role.findMany({ select: { id: true, name: true, displayName: true } });
      const roleMap = Object.fromEntries(roles.map(r => [r.id, r.displayName || r.name]));
      usersByRole = usersByRoleRaw.map(r => ({
        role: roleMap[r.roleId] || 'Unknown',
        count: r._count.userId
      }));
    }

    // Asset activity last 7 days (audit events grouped by day)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentEvents = await prisma.auditEvent.findMany({
      where: { ...auditWhere, createdAt: { gte: sevenDaysAgo } },
      select: { eventType: true, createdAt: true }
    });

    // Build day-by-day buckets
    const dayBuckets = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dayBuckets[key] = { date: key, minted: 0, transferred: 0, created: 0, other: 0 };
    }
    for (const ev of recentEvents) {
      const key = new Date(ev.createdAt).toISOString().slice(0, 10);
      if (!dayBuckets[key]) continue;
      if (ev.eventType?.includes('MINTED')) dayBuckets[key].minted++;
      else if (ev.eventType?.includes('TRANSFERRED')) dayBuckets[key].transferred++;
      else if (ev.eventType?.includes('CREATED')) dayBuckets[key].created++;
      else dayBuckets[key].other++;
    }
    const assetActivity = Object.values(dayBuckets);

    return success(res, {
      assetsByCategory,
      identitiesByStatus,
      usersByRole,
      assetActivity
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

