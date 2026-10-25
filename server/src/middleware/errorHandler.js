const logger = require('../utils/logger');

/**
 * Global error handler middleware.
 * Returns safe error responses — never exposes stack traces in production.
 */
function errorHandler(err, req, res, next) {
  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'A record with this value already exists',
      code: 'DUPLICATE_RECORD',
      field: err.meta?.target?.[0] || 'unknown',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found',
      code: 'NOT_FOUND',
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      error: 'Invalid reference: related record does not exist',
      code: 'INVALID_REFERENCE',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' });
  }

  // File upload errors (Multer)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large', code: 'FILE_TOO_LARGE' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field', code: 'INVALID_FILE_FIELD' });
  }

  // Default: log and return generic error
  const statusCode = err.statusCode || err.status || 500;

  logger.error({
    err: {
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    },
    req: {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
    },
  }, 'Unhandled error');

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    code: err.code || 'INTERNAL_ERROR',
  });
}

/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
}

/**
 * Create an AppError with a status code
 */
class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = { errorHandler, notFoundHandler, AppError };
