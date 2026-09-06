const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const prisma = require('../utils/prisma');
const { success, error, paginate } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const blockchain = require('../services/blockchain');

const router = express.Router();

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map(v => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return error(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors.array());
};

async function callBlockchain(fn, fallbackHash) {
  try {
    const result = await fn();
    return result.hash || result.transactionHash || fallbackHash;
  } catch (e) {
    console.warn('Blockchain call skipped (no node):', e.message);
    return fallbackHash;
  }
}

/**
 * @route GET /api/v1/assets
 * @desc List assets
 */
router.get('/', requireAuth, requirePermission('asset.read'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.category) where.category = req.query.category;

    // Search
    if (req.query.search) {
      where.OR = [
        { assetCode: { contains: req.query.search, mode: 'insensitive' } },
        { name: { contains: req.query.search, mode: 'insensitive' } },
        { category: { contains: req.query.search, mode: 'insensitive' } }
      ];
    }

    // Scoped access: logic to restrict based on role
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('auditor')) {
      if (req.user.roles.includes('manager')) {
        where.OR = [
          { managerScopes: { some: { managerUserId: req.user.id, revokedAt: null } } },
          { ownershipRecords: { some: { ownerUserId: req.user.id, isCurrent: true } } }
        ];
      } else {
        where.ownershipRecords = { some: { ownerUserId: req.user.id, isCurrent: true } };
      }
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        include: { 
          ownershipRecords: { 
            where: { isCurrent: true },
            include: {
              didRecord: { select: { did: true, user: { select: { name: true } } } },
              owner: { select: { name: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.asset.count({ where })
    ]);

    // Serialize BigInts
    const formattedAssets = assets.map(a => ({
      ...a,
      tokenId: a.tokenId ? a.tokenId.toString() : null,
      ownershipRecords: a.ownershipRecords.map(or => ({
        ...or,
        blockNumber: or.blockNumber ? or.blockNumber.toString() : null
      }))
    }));

    return paginate(res, formattedAssets, page, limit, total);
  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/v1/assets
 * @desc Mint a new asset
 */
router.post('/', requireAuth, requirePermission('asset.create'), validate([
  body('assetCode').notEmpty().withMessage('Asset code required'),
  body('name').notEmpty().withMessage('Name required'),
  body('category').notEmpty().withMessage('Category required'),
  body('ownerDid').optional().isString()
]), async (req, res, next) => {
  try {
    const { assetCode, name, category, description, location, metadata, ownerDid } = req.body;

    // 1. Validate uniqueness
    const existing = await prisma.asset.findUnique({ where: { assetCode } });
    if (existing) return error(res, 'Asset code already exists', 409);

    // 2. Validate target DID if provided
    let targetDid = 'PLATFORM';
    let targetUserId = null;
    if (ownerDid && ownerDid !== 'PLATFORM') {
      const dbDid = await prisma.did.findUnique({ where: { did: ownerDid } });
      if (!dbDid) return error(res, 'Target DID not found', 404);
      targetDid = dbDid.did;
      targetUserId = dbDid.userId;
    }

    // 3. Prepare Metadata Hash
    const offchainData = { assetCode, name, category, description, location, metadata };
    const metadataString = JSON.stringify(offchainData);
    const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex');
    const bytes32MetadataHash = '0x' + metadataHash;
    const tokenURIStr = `ipfs://decentravault/${assetCode}`;

    // 4. Mint on Blockchain (with fallback)
    let tokenId = BigInt(Date.now() % 1000000 + Math.floor(Math.random() * 1000));
    const fallbackHash = '0xmint_' + Math.random().toString(36).substr(2, 16);
    let txHash = fallbackHash;

    try {
      const mintResult = await blockchain.mintAsset(targetDid, bytes32MetadataHash, tokenURIStr);
      txHash = mintResult.hash || mintResult.transactionHash || fallbackHash;
      // Try to parse tokenId from logs
      if (mintResult.logs && mintResult.logs.length > 0) {
        try {
          const transferLog = mintResult.logs.find(l => l.topics && l.topics.length >= 4);
          if (transferLog) {
            tokenId = BigInt(transferLog.topics[3]);
          }
        } catch {}
      }
    } catch (blockchainError) {
      console.warn('Blockchain mint skipped (no node):', blockchainError.message);
    }

    // 5. Database transaction
    const result = await prisma.$transaction(async (txPrisma) => {
      const newAsset = await txPrisma.asset.create({
        data: {
          assetCode,
          name,
          category,
          description,
          location,
          status: targetDid === 'PLATFORM' ? 'minted' : 'assigned',
          tokenId,
          metadataHash: bytes32MetadataHash,
          mintTxHash: txHash,
          createdBy: req.user.id
        }
      });

      if (metadata && typeof metadata === 'object') {
        const metadataArray = Object.keys(metadata).map(k => ({
          assetId: newAsset.id,
          key: k,
          value: String(metadata[k])
        }));
        if (metadataArray.length > 0) {
          await txPrisma.assetMetadata.createMany({ data: metadataArray });
        }
      }

      await txPrisma.ownershipRecord.create({
        data: {
          assetId: newAsset.id,
          ownerDid: targetDid === 'PLATFORM' ? 'PLATFORM' : targetDid,
          ownerUserId: targetUserId,
          action: 'mint',
          txHash,
          isCurrent: true
        }
      });

      const eventHash = crypto.createHash('sha256').update(`ASSET_MINTED:${assetCode}:${txHash}:${Date.now()}`).digest('hex');
      await txPrisma.auditEvent.create({
        data: {
          eventType: 'ASSET_MINTED',
          actorUserId: req.user.id,
          actorRole: req.user.roles[0] || 'admin',
          entityType: 'asset',
          entityId: newAsset.id,
          action: 'mint',
          payload: { assetCode, targetDid, category },
          txHash,
          eventHash
        }
      });

      // Notification
      await txPrisma.notification.create({
        data: {
          userId: req.user.id,
          type: 'asset_minted',
          title: 'Asset Minted',
          body: `Asset "${name}" (${assetCode}) has been minted successfully`,
          entityType: 'asset',
          entityId: newAsset.id
        }
      });

      return newAsset;
    });

    return success(res, {
      asset: { ...result, tokenId: result.tokenId ? result.tokenId.toString() : null },
      txHash
    }, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/v1/assets/:id/transfer
 * @desc Transfer asset ownership
 */
router.post('/:id/transfer', requireAuth, requirePermission('asset.transfer'), validate([
  body('toDid').notEmpty().withMessage('Target DID required')
]), async (req, res, next) => {
  try {
    const { toDid } = req.body;
    const assetId = req.params.id;

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { ownershipRecords: { where: { isCurrent: true } } }
    });

    if (!asset) return error(res, 'Asset not found', 404);

    const currentOwnerRec = asset.ownershipRecords[0];
    const fromDid = currentOwnerRec ? currentOwnerRec.ownerDid : 'PLATFORM';

    const targetDidRecord = await prisma.did.findUnique({ where: { did: toDid } });
    if (!targetDidRecord) return error(res, 'Target DID not found', 404);

    // Blockchain transfer (with fallback)
    const fallbackHash = '0xtransfer_' + Math.random().toString(36).substr(2, 16);
    let txHash = fallbackHash;

    if (asset.tokenId) {
      try {
        const transferResult = await blockchain.platformTransfer(asset.tokenId, fromDid, toDid);
        txHash = transferResult.hash || transferResult.transactionHash || fallbackHash;
      } catch (e) {
        console.warn('Blockchain transfer skipped (no node):', e.message);
      }
    }

    await prisma.$transaction(async (txPrisma) => {
      if (currentOwnerRec) {
        await txPrisma.ownershipRecord.update({
          where: { id: currentOwnerRec.id },
          data: { isCurrent: false }
        });
      }

      await txPrisma.ownershipRecord.create({
        data: {
          assetId: asset.id,
          ownerDid: toDid,
          ownerUserId: targetDidRecord.userId,
          fromDid,
          fromUserId: currentOwnerRec ? currentOwnerRec.ownerUserId : null,
          action: 'transfer',
          txHash,
          isCurrent: true
        }
      });

      await txPrisma.asset.update({
        where: { id: asset.id },
        data: { status: 'assigned' }
      });

      const eventHash = crypto.createHash('sha256').update(`ASSET_TRANSFERRED:${asset.assetCode}:${txHash}:${Date.now()}`).digest('hex');
      await txPrisma.auditEvent.create({
        data: {
          eventType: 'ASSET_TRANSFERRED',
          actorUserId: req.user.id,
          actorRole: req.user.roles[0] || 'admin',
          entityType: 'asset',
          entityId: asset.id,
          action: 'transfer',
          payload: { fromDid, toDid, assetCode: asset.assetCode },
          txHash,
          eventHash
        }
      });

      // Notification for both parties
      await txPrisma.notification.create({
        data: {
          userId: targetDidRecord.userId,
          type: 'asset_transferred',
          title: 'Asset Transfer Received',
          body: `You received ownership of "${asset.name}" (${asset.assetCode})`,
          entityType: 'asset',
          entityId: asset.id
        }
      });
    });

    return success(res, { message: 'Transfer completed', txHash });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/v1/assets/:id
 * @desc Get asset details
 */
router.get('/:id', requireAuth, requirePermission('asset.read'), async (req, res, next) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        metadata: true,
        creator: { select: { name: true, email: true } },
        ownershipRecords: {
          orderBy: { transferredAt: 'desc' },
          include: { 
            didRecord: { select: { did: true, user: { select: { name: true } } } },
            fromUser: { select: { name: true } },
            owner: { select: { name: true, email: true } }
          }
        }
      }
    });

    if (!asset) return error(res, 'Asset not found', 404);

    return success(res, {
      ...asset,
      tokenId: asset.tokenId ? asset.tokenId.toString() : null,
      ownershipRecords: asset.ownershipRecords.map(or => ({
        ...or,
        blockNumber: or.blockNumber ? or.blockNumber.toString() : null
      }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
