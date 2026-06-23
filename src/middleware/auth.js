// File: src/middleware/auth.js
const { verifyAccessToken } = require('../utils/jwt');
const { AppError } = require('../utils/AppError');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.tr_token;
    if (!token && req.headers.authorization?.startsWith('Bearer '))
      token = req.headers.authorization.split(' ')[1];
    if (!token) return next(new AppError('Authentication required. Please login.', 401, 'AUTH_REQUIRED'));

    const decoded = verifyAccessToken(token);
    if (!decoded) return next(new AppError('Session expired. Please login again.', 401, 'TOKEN_EXPIRED'));

    const user = await User.findById(decoded.id).select('+password');
    if (!user) return next(new AppError('User not found.', 401, 'USER_NOT_FOUND'));
    if (user.isSuspended) return next(new AppError(`Account suspended: ${user.suspendedReason || 'Contact support'}`, 403, 'ACCOUNT_SUSPENDED'));

    req.user = user;
    next();
  } catch (err) {
    next(new AppError('Authentication failed.', 401, 'AUTH_FAILED'));
  }
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return next(new AppError('You do not have permission for this action.', 403, 'FORBIDDEN'));
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.tr_token || req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) req.user = await User.findById(decoded.id);
    }
  } catch (_) {}
  next();
};

const requirePlan = (...plans) => (req, res, next) => {
  const TIER = { free: 0, silver: 1, gold: 2, diamond: 3 };
  const userTier = TIER[req.user?.plan] || 0;
  const minTier  = Math.min(...plans.map(p => TIER[p] || 0));
  if (!req.user?.isPremiumActive() || userTier < minTier)
    return next(new AppError(`This feature requires ${plans[0]} plan or higher.`, 403, 'UPGRADE_REQUIRED'));
  next();
};

module.exports = { protect, restrictTo, optionalAuth, requirePlan };
