// File: src/routes/contactRoutes.js
const router = require("express").Router();
const { optionalAuth } = require("../middleware/auth");
const { contactLimiter } = require("../middleware/rateLimiter");
const { submitMessage } = require("../controllers/contactController");

// Public — logged-out visitors can use the Contact page too.
// optionalAuth attaches req.user when a valid token is present, without requiring one.
router.post("/", contactLimiter, optionalAuth, submitMessage);

module.exports = router;