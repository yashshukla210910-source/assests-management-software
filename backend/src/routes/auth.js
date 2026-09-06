const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');
const { generateTokens } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return error(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  };
};

/**
 * @route POST /api/v1/auth/login
 * @desc Authenticate user and get tokens
 */
router.post('/login', validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
]), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          where: { revokedAt: null },
          include: { role: true }
        }
      }
    });

    if (!user || user.status !== 'active') {
      return error(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: { increment: 1 } }
      });
      return error(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Reset failed logins
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lastLoginAt: new Date() }
    });

    const tokens = generateTokens(user);

    // Save refresh token hash
    const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.authToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent']
      }
    });

    return success(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.userRoles.map(ur => ur.role.name)
      },
      tokens
    });

  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/v1/auth/refresh
 * @desc Refresh access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token required', 400);

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    const dbToken = await prisma.authToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { userRoles: { include: { role: true } } } } }
    });

    if (!dbToken || dbToken.revokedAt || new Date() > dbToken.expiresAt) {
      return error(res, 'Invalid or expired refresh token', 401, 'INVALID_TOKEN');
    }

    const tokens = generateTokens(dbToken.user);

    // Revoke old token, create new one (rotation)
    await prisma.$transaction([
      prisma.authToken.update({
        where: { id: dbToken.id },
        data: { revokedAt: new Date(), usedAt: new Date() }
      }),
      prisma.authToken.create({
        data: {
          userId: dbToken.user.id,
          tokenHash: crypto.createHash('sha256').update(tokens.refreshToken).digest('hex'),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: req.ip,
          deviceInfo: req.headers['user-agent']
        }
      })
    ]);

    return success(res, { tokens });

  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user (revoke token)
 */
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await prisma.authToken.updateMany({
        where: { tokenHash, userId: req.user.id },
        data: { revokedAt: new Date() }
      });
    }
    return success(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/v1/auth/did-challenge
 * @desc Request a nonce for DID authentication
 */
router.post('/did-challenge', async (req, res, next) => {
  try {
    const { did } = req.body;
    if (!did) return error(res, 'DID required', 400);

    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.nonceStore.create({
      data: {
        nonce,
        did,
        expiresAt
      }
    });

    return success(res, { nonce, expiresAt });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
