const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const prisma = require('../utils/prisma');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return error(res, 'Invalid or expired token', 401, 'INVALID_TOKEN');
    }

    // Attach user payload to request
    req.user = decoded;
    
    // Optionally fetch full user to ensure they are still active
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { status: true }
    });

    if (!dbUser || dbUser.status !== 'active') {
      return error(res, 'Account is inactive or suspended', 403, 'FORBIDDEN');
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAuth };
