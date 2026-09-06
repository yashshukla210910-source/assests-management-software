const jwt = require('jsonwebtoken');

const generateTokens = (user) => {
  // Use a secure RS256 keypair in prod, symmetric HS256 for dev/demo if not provided
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  
  const payload = {
    id: user.id,
    email: user.email,
    roles: user.userRoles ? user.userRoles.map(ur => ur.role.name) : []
  };

  const accessToken = jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });

  const refreshToken = jwt.sign({ id: user.id }, secret, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  });

  return { accessToken, refreshToken };
};

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

module.exports = { generateTokens, verifyToken };
