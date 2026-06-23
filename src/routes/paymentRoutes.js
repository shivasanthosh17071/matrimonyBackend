// File: src/routes/paymentRoutes.js
const router = require("express").Router();
const c = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.post("/razorpay/create-order", protect, c.createRazorpayOrder);
router.post("/razorpay/verify", protect, c.verifyRazorpayPayment);
router.post("/stripe/create-session", protect, c.createStripeSession);
router.get("/history", protect, c.getPaymentHistory);
// Webhooks registered separately in app.js (need raw body)

module.exports = router;
