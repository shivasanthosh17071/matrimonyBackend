// File: src/routes/chatRoutes.js
const router = require("express").Router();
const c = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

router.get("/conversations", protect, c.getConversations);
router.get("/:partnerId/messages", protect, c.getMessages);
router.post("/:partnerId/messages", protect, c.sendMessage);
router.delete("/messages/:messageId", protect, c.deleteMessage);
router.patch("/messages/:messageId", protect, c.editMessage);
module.exports = router;
