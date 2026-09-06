/**
 * Standard API response helpers
 */

const success = (res, data, statusCode = 200, meta = null) => {
  const response = { success: true, data, error: null };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

const created = (res, data) => success(res, data, 201);

const noContent = (res) => res.status(204).send();

const error = (res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) => {
  const errObj = { code, message };
  if (details) errObj.details = details;
  return res.status(statusCode).json({ success: false, data: null, error: errObj });
};

const paginate = (res, data, page, limit, total) => {
  return success(res, data, 200, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / limit),
  });
};

module.exports = { success, created, noContent, error, paginate };
