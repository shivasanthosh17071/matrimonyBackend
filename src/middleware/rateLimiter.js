// File: src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

const mkLimiter = (windowMs, max, message, code) => rateLimit({
  windowMs, max, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => sendError(res, message, 429, code),
  skip: () => process.env.NODE_ENV === 'test',
});

const apiLimiter    = mkLimiter(900000, 100,  'Too many requests. Try again later.', 'RATE_LIMIT');
const authLimiter   = mkLimiter(900000, 10,   'Too many login attempts. Try in 15 minutes.', 'AUTH_RATE_LIMIT');
const otpLimiter    = mkLimiter(600000, 5,    'Too many OTP requests. Please wait.', 'OTP_RATE_LIMIT');
const searchLimiter = mkLimiter(60000,  30,   'Too many search requests.', 'SEARCH_RATE_LIMIT');

module.exports = { apiLimiter, authLimiter, otpLimiter, searchLimiter };
