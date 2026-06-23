// File: src/utils/jwt.js
const jwt = require('jsonwebtoken');
const logger = require('./logger');

const generateAccessToken = (userId, role = 'user') =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

const verifyAccessToken = (token) => {
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch (err) { logger.warn(`JWT verify failed: ${err.message}`); return null; }
};

const verifyRefreshToken = (token) => {
  try { return jwt.verify(token, process.env.JWT_REFRESH_SECRET); }
  catch (err) { return null; }
};

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_DAYS || '7') * 24 * 60 * 60 * 1000,
};

const setTokenCookie  = (res, token) => res.cookie('tr_token', token, COOKIE_OPTIONS);
const clearTokenCookie = (res) => res.cookie('tr_token', '', { ...COOKIE_OPTIONS, maxAge: 0 });

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, setTokenCookie, clearTokenCookie };
