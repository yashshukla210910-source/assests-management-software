const express = require('express');
const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/v1/transactions/:hash
 * @desc Get transaction details from cache
 */
router.get('/:hash', requireAuth, async (req, res, next) => {
  try {
    const { hash } = req.params;

    // Check our tx cache
    const cached = await prisma.txCache.findUnique({ where: { txHash: hash } });
    if (cached) {
      return success(res, {
        ...cached,
        blockNumber: cached.blockNumber ? cached.blockNumber.toString() : null,
        gasUsed: cached.gasUsed ? cached.gasUsed.toString() : null
      });
    }

    // Try to look up in ownership records or audit events for context
    const ownership = await prisma.ownershipRecord.findFirst({
      where: { txHash: hash },
      include: {
        asset: { select: { name: true, assetCode: true, category: true } },
        didRecord: { select: { did: true, user: { select: { name: true } } } }
      }
    });

    const auditEvent = await prisma.auditEvent.findFirst({
      where: { txHash: hash },
      include: { actor: { select: { name: true, email: true } } }
    });

    return success(res, {
      txHash: hash,
      status: 'confirmed',
      chainId: parseInt(process.env.CHAIN_ID || '31337'),
      ownership: ownership ? {
        assetCode: ownership.asset?.assetCode,
        assetName: ownership.asset?.name,
        action: ownership.action,
        ownerDid: ownership.ownerDid,
        transferredAt: ownership.transferredAt,
        blockNumber: ownership.blockNumber ? ownership.blockNumber.toString() : null
      } : null,
      auditEvent: auditEvent ? {
        eventType: auditEvent.eventType,
        entityType: auditEvent.entityType,
        entityId: auditEvent.entityId,
        actor: auditEvent.actor,
        createdAt: auditEvent.createdAt
      } : null
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
