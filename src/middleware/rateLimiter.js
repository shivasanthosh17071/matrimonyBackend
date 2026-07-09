// File: src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

const mkLimiter = (windowMs, max, message, code) => rateLimit({
  windowMs, max, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => sendError(res, message, 429, code),
  skip: () => process.env.NODE_ENV === 'test',
});

const apiLimiter = mkLimiter(15 * 60 * 1000, 300, "Too many requests. Please wait a few minutes and try again.", "RATE_LIMIT");
const authLimiter = mkLimiter(15 * 60 * 1000, 20, "Too many login attempts. Please wait 15 minutes before trying again.", "AUTH_RATE_LIMIT");
const otpLimiter = mkLimiter(10 * 60 * 1000, 10, "You've requested too many OTPs. Please wait a few minutes.", "OTP_RATE_LIMIT");
const searchLimiter = mkLimiter(60 * 1000, 120, "You're searching too quickly. Please slow down for a moment.", "SEARCH_RATE_LIMIT");
const contactLimiter = mkLimiter(60 * 60 * 1000, 20, "You've sent too many messages. Please try again later.", "CONTACT_RATE_LIMIT");

module.exports = { apiLimiter, authLimiter, otpLimiter, searchLimiter, contactLimiter };