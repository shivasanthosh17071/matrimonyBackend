// File: src/routes/matchRoutes.js
const router = require('express').Router();
const c = require('../controllers/matchController');
const { protect, optionalAuth } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');

router.get('/browse',              optionalAuth,  searchLimiter, c.browseProfiles);
router.get('/daily',               protect,                      c.getDailyMatches);
router.get('/jatakam/:profileId',  protect,                      c.getJatakamCompatibility);

module.exports = router;
