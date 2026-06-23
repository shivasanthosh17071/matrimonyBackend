// File: src/routes/interestRoutes.js
const router = require("express").Router();
const c = require("../controllers/interestController");
const { protect } = require("../middleware/auth");
router.get("/status/:userId", protect, c.getInterestStatus);
router.post("/send", protect, c.sendInterest);
router.patch("/:id/respond", protect, c.respondToInterest);
router.get("/inbox", protect, c.getInbox);
router.get("/sent", protect, c.getSent);
router.get("/mutual", protect, c.getMutualMatches);

module.exports = router;
