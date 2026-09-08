const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const prisma = require('../utils/prisma');
const { success, error, paginate } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { generateDidCredentials, encryptPrivateKey, generateDidDocument } = require('../utils/did');
const blockchain = require('../services/blockchain');

const router = express.Router();

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map(v => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return error(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors.array());
};

/**
 * @route GET /api/v1/identities
 * @desc List identities
 */
router.get('/', requireAuth, requirePermission('identity.read'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.status) where.status = req.query.status;

    // Scoped access: if not admin/auditor, only see own
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('auditor')) {
      where.userId = req.user.id;
    }

    // Search filter
    if (req.query.search) {
      where.OR = [
        { did: { contains: req.query.search, mode: 'insensitive' } },
        { user: { name: { contains: req.query.search, mode: 'insensitive' } } },
        { user: { email: { contains: req.query.search, mode: 'insensitive' } } }
      ];
    }

    const [identities, total] = await Promise.all([
      prisma.did.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true, name: true, email: true, organization: true, status: true,
              userRoles: {
                where: { revokedAt: null },
                include: { role: { select: { name: true, displayName: true } } }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.did.count({ where })
    ]);

    return paginate(res, identities, page, limit, total);
  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/v1/identities
 * @desc Create a new identity (User + DID + Blockchain Registration)
 */
router.post('/', requireAuth, requirePermission('identity.create'), validate([
  body('email').isEmail().withMessage('Valid email required'),
  body('name').notEmpty().withMessage('Name required'),
  body('role').notEmpty().withMessage('Role required')
]), async (req, res, next) => {
  try {
    const { email, name, organization, role, password, walletAddress } = req.body;

    // 1. Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return error(res, 'User with this email already exists', 409);
    }

    // 2. Resolve Role
    const dbRole = await prisma.role.findUnique({ where: { name: role } });
    if (!dbRole) return error(res, 'Invalid role specified', 400);

    // 3. Generate Crypto Identity or use provided Wallet Address
    let privateKey, publicKey, address, did, chainId, encryptedKey, didDoc;

    if (walletAddress && walletAddress.startsWith('0x')) {
      // User provided an external MetaMask wallet
      address = walletAddress;
      chainId = process.env.CHAIN_ID || 11155111;
      did = `did:ethr:${chainId}:${address}`;
      publicKey = '0x'; // Public key is not strictly needed for external wallets, signature recovery will be used
      encryptedKey = 'EXTERNAL_WALLET';
      didDoc = JSON.stringify({ "@context": "https://w3id.org/did/v1", "id": did });
    } else {
      // Generate random custodial wallet
      const credentials = generateDidCredentials();
      privateKey = credentials.privateKey;
      publicKey = credentials.publicKey;
      address = credentials.address;
      did = credentials.did;
      chainId = credentials.chainId;
      const encryptionResult = encryptPrivateKey(privateKey);
      encryptedKey = encryptionResult.encryptedKey;
      didDoc = generateDidDocument(did, publicKey);
    }

    // Metadata hash for blockchain
    const metadataString = JSON.stringify({ name, email, organization, did });
    const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex');
    const bytes32MetadataHash = '0x' + metadataHash;

    // 4. Register on Blockchain (with graceful fallback)
    let txHash = 'mock_tx_' + Math.random().toString(36).substr(2, 12);
    try {
      const tx = await blockchain.registerIdentity(did, address, bytes32MetadataHash);
      txHash = tx.hash || tx.transactionHash || txHash;
    } catch (blockchainError) {
      console.warn('Blockchain registration skipped (no node):', blockchainError.message);
    }

    // 5. Save to Database (Transaction)
    const bcryptjs = require('bcryptjs');
    const actualPassword = password || 'TempPass@' + Math.random().toString(36).substr(2, 8);
    const passwordHash = await bcryptjs.hash(actualPassword, 10);

    const result = await prisma.$transaction(async (txPrisma) => {
      const newUser = await txPrisma.user.create({
        data: { email, name, organization, passwordHash, status: 'active' }
      });

      await txPrisma.userRole.create({
        data: { userId: newUser.id, roleId: dbRole.id, assignedBy: req.user.id }
      });

      const newDid = await txPrisma.did.create({
        data: { userId: newUser.id, did, address, publicKey, chainId: parseInt(chainId), onChainTx: txHash }
      });

      await txPrisma.keyStore.create({
        data: { didId: newDid.id, encryptedKey }
      });

      await txPrisma.didDocument.create({
        data: { didId: newDid.id, document: didDoc }
      });

      const eventHash = crypto.createHash('sha256').update(`IDENTITY_CREATED:${newDid.did}:${txHash}:${Date.now()}`).digest('hex');
      await txPrisma.auditEvent.create({
        data: {
          eventType: 'IDENTITY_CREATED',
          actorUserId: req.user.id,
          actorRole: req.user.roles[0] || 'admin',
          entityType: 'identity',
          entityId: newDid.did,
          action: 'create',
          payload: { email, did, address, role },
          txHash,
          eventHash
        }
      });

      // Notification for admin
      await txPrisma.notification.create({
        data: {
          userId: req.user.id,
          type: 'identity_created',
          title: 'Identity Created',
          body: `New identity created for ${name} (${email})`,
          entityType: 'identity',
          entityId: newDid.did
        }
      });

      return { user: newUser, did: newDid };
    });

    return success(res, {
      did: result.did.did,
      address,
      txHash,
      userId: result.user.id,
      temporaryPassword: password ? undefined : actualPassword
    }, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/v1/identities/:did
 * @desc Get identity details
 */
router.get('/:did', requireAuth, requirePermission('identity.read'), async (req, res, next) => {
  try {
    const identity = await prisma.did.findUnique({
      where: { did: req.params.did },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, organization: true, status: true,
            userRoles: {
              where: { revokedAt: null },
              include: { role: { select: { name: true, displayName: true } } }
            }
          }
        },
        didDocuments: { where: { isCurrent: true } }
      }
    });

    if (!identity) return error(res, 'Identity not found', 404);
    return success(res, identity);
  } catch (err) {
    next(err);
  }
});

/**
 * @route PATCH /api/v1/identities/:did/revoke
 * @desc Revoke an identity
 */
router.patch('/:did/revoke', requireAuth, requirePermission('identity.revoke'), async (req, res, next) => {
  try {
    const identity = await prisma.did.findUnique({ where: { did: req.params.did } });
    if (!identity) return error(res, 'Identity not found', 404);
    if (identity.status === 'revoked') return error(res, 'Identity already revoked', 400);

    // Blockchain revoke with fallback
    try {
      await blockchain.revokeIdentity(identity.did);
    } catch (e) {
      console.warn('Blockchain revoke skipped:', e.message);
    }

    await prisma.did.update({
      where: { did: req.params.did },
      data: { status: 'revoked', revokedAt: new Date() }
    });

    const eventHash = crypto.createHash('sha256').update(`IDENTITY_REVOKED:${identity.did}:${Date.now()}`).digest('hex');
    await prisma.auditEvent.create({
      data: {
        eventType: 'IDENTITY_REVOKED',
        severity: 'warning',
        actorUserId: req.user.id,
        actorRole: req.user.roles[0] || 'admin',
        entityType: 'identity',
        entityId: identity.did,
        action: 'revoke',
        payload: { reason: req.body.reason || 'Admin revocation' },
        eventHash
      }
    });

    return success(res, { message: 'Identity revoked successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * @route PATCH /api/v1/identities/:did/suspend
 * @desc Suspend an identity
 */
router.patch('/:did/suspend', requireAuth, requirePermission('identity.revoke'), async (req, res, next) => {
  try {
    const identity = await prisma.did.findUnique({ where: { did: req.params.did } });
    if (!identity) return error(res, 'Identity not found', 404);
    
    const newStatus = identity.status === 'suspended' ? 'active' : 'suspended';
    
    await prisma.did.update({
      where: { did: req.params.did },
      data: { status: newStatus, suspendedAt: newStatus === 'suspended' ? new Date() : null }
    });

    const eventHash = crypto.createHash('sha256').update(`IDENTITY_${newStatus.toUpperCase()}:${identity.did}:${Date.now()}`).digest('hex');
    await prisma.auditEvent.create({
      data: {
        eventType: newStatus === 'suspended' ? 'IDENTITY_SUSPENDED' : 'IDENTITY_REACTIVATED',
        severity: 'warning',
        actorUserId: req.user.id,
        actorRole: req.user.roles[0] || 'admin',
        entityType: 'identity',
        entityId: identity.did,
        action: newStatus === 'suspended' ? 'suspend' : 'reactivate',
        payload: { reason: req.body.reason },
        eventHash
      }
    });

    return success(res, { message: `Identity ${newStatus === 'suspended' ? 'suspended' : 'reactivated'} successfully`, status: newStatus });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
