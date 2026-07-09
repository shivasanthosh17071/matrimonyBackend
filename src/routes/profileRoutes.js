// File: src/routes/profileRoutes.js
const router = require('express').Router();
const c = require('../controllers/profileController');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload, uploadPDF } = require('../middleware/upload');

router.get('/me',                               protect,       c.getMyProfile);
router.put('/wizard/step/:step',                protect,       c.updateWizardStep);
router.post('/photos',                          protect,       upload.single('photo'),   c.uploadPhoto);
router.delete('/photos/:publicId',              protect,       c.deletePhoto);
router.put('/photos/:publicId/primary',       protect,       c.setPrimaryPhoto);
router.put('/photos/:publicId/privacy',       protect,       c.togglePhotoPrivacy);
router.post('/jatakam/pdf',                     protect,       uploadPDF.single('pdf'),  c.uploadJatakamPDF);
router.get('/:id',                              optionalAuth,  c.getProfile);

module.exports = router;
