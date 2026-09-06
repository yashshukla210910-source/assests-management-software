const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.stack || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  if (err.name === 'ValidationError') {
    return error(res, err.message, 400, 'VALIDATION_ERROR', err.details);
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    // Handle specific Prisma errors like unique constraint violations
    if (err.code === 'P2002') {
      return error(res, 'A record with this value already exists.', 409, 'DUPLICATE_RECORD', err.meta);
    }
  }

  return error(res, message, statusCode, code);
};

module.exports = { errorHandler };
