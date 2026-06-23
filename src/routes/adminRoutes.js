// File: src/routes/adminRoutes.js
const router = require("express").Router();
const c = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/auth");

router.use(protect, restrictTo("admin", "moderator"));

router.get("/dashboard", c.getDashboard);
router.get("/users", c.getUsers);
router.patch("/users/:id/suspend", restrictTo("admin"), c.suspendUser);
router.patch("/users/:id/unsuspend", restrictTo("admin"), c.unsuspendUser);
router.patch("/users/:id/verify-aadhaar", c.verifyAadhaar);
router.patch("/users/:id/feature", c.toggleFeature);
router.get("/photos/pending", c.getPendingPhotos);
router.patch("/photos/approve", c.approvePhoto);
router.delete("/photos/reject", c.rejectPhoto);
router.get("/reports", c.getReports);
router.patch("/reports/:id/resolve", c.resolveReport);
router.get("/payments", restrictTo("admin"), c.getPayments);

module.exports = router;
