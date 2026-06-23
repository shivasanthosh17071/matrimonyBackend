// File: src/middleware/errorHandler.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let { message, statusCode = 500, code = 'INTERNAL_ERROR' } = err;

  if (err.name === 'CastError')       { message = `Invalid value for ${err.path}`; statusCode = 400; code = 'INVALID_ID'; }
  if (err.code === 11000)             { const f = Object.keys(err.keyValue||{})[0]; message = `${f} is already registered.`; statusCode = 409; code = 'DUPLICATE_KEY'; }
  if (err.name === 'ValidationError') { message = Object.values(err.errors).map(e => e.message).join('. '); statusCode = 422; code = 'VALIDATION_ERROR'; }
  if (err.name === 'JsonWebTokenError') { message = 'Invalid token. Please login again.'; statusCode = 401; code = 'INVALID_TOKEN'; }
  if (err.name === 'TokenExpiredError')  { message = 'Session expired. Please login again.'; statusCode = 401; code = 'TOKEN_EXPIRED'; }

  if (statusCode >= 500) logger.error(`[${req.method}] ${req.originalUrl} — ${message}`, { stack: err.stack, userId: req.user?._id });

  res.status(statusCode).json({
    success: false, message, code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
