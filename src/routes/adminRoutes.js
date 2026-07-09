// File: src/routes/adminRoutes.js
const router = require('express').Router();
const c = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin', 'moderator'));

router.get('/dashboard',                   c.getDashboard);
router.get('/users',                       c.getUsers);
router.put('/users/:id/suspend',         restrictTo('admin'), c.suspendUser);
router.put('/users/:id/unsuspend',       restrictTo('admin'), c.unsuspendUser);
router.put('/users/:id/verify-aadhaar',  c.verifyAadhaar);
router.put('/users/:id/feature',         c.toggleFeature);
router.get('/photos/pending',              c.getPendingPhotos);
router.put('/photos/approve',            c.approvePhoto);
router.delete('/photos/reject',            c.rejectPhoto);
router.get('/reports',                     c.getReports);
router.put('/reports/:id/resolve',       c.resolveReport);
router.get('/payments',                    restrictTo('admin'), c.getPayments);
router.get('/contact-messages',            c.getContactMessages);
router.put('/contact-messages/:id/status', c.updateContactMessageStatus);

module.exports = router;