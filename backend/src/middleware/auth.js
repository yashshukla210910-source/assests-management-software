const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const prisma = require('../utils/prisma');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let decoded = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      decoded = verifyToken(token);
    }

    if (!decoded) {
      // DEV/DEMO OVERRIDE: If no token is provided, automatically log them in as the Admin
      // so anyone with the Vercel link can access the app without a private key.
      const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@decentravault.com' },
        include: { userRoles: { include: { role: true } }, dids: true }
      });
      
      if (!adminUser) {
        return error(res, 'Authentication required and no admin user found', 401, 'UNAUTHORIZED');
      }

      decoded = {
        id: adminUser.id,
        email: adminUser.email,
        roles: adminUser.userRoles.map(ur => ur.role.name),
        did: adminUser.dids[0]?.did
      };
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
