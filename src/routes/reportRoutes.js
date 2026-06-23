// File: src/routes/reportRoutes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { submitReport } = require('../controllers/reportController');

router.post('/', protect, submitReport);

module.exports = router;
