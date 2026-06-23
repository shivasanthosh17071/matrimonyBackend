// File: src/controllers/chatController.js
const Message = require("../models/Message");
const Interest = require("../models/Interest");
const User = require("../models/User");
const { catchAsync, AppError } = require("../utils/AppError");
const { sendSuccess, sendPaginated } = require("../utils/apiResponse");

const canChat = async (id1, id2) =>
  !!(await Interest.findOne({
    $or: [
      { sender: id1, receiver: id2, status: "accepted" },
      { sender: id2, receiver: id1, status: "accepted" },
    ],
  }));

// ── GET /api/chat/conversations ───────────────────────────
exports.getConversations = catchAsync(async (req, res) => {
  const userId = req.user._id;
  // console.log("USER ID", userId);
  // console.log("TYPE", typeof userId);
  const convos = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }],
        isDeleted: false,
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$conversationId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", userId] },
                  { $eq: ["$isRead", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
    { $limit: 50 },
  ]);

  const enriched = await Promise.all(
    convos.map(async (c) => {
      const partnerId = c._id.split("_").find((id) => id !== userId.toString());

      const partner = await User.findById(partnerId).select(
        "displayName age city district photos isOnline lastSeen plan mobileVerified",
      );

      return { ...c, partner };
    }),
  );

  // Existing conversation partner ids
  const existingPartnerIds = new Set(
    enriched.map((c) => c.partner?._id?.toString()),
  );

  // Accepted interests
  const interests = await Interest.find({
    status: "accepted",
    $or: [{ sender: userId }, { receiver: userId }],
  })
    .populate(
      "sender receiver",
      "displayName age city district photos isOnline lastSeen plan mobileVerified",
    )
    .lean();

  // Matches without messages
  const matchedUsers = interests
    .map((i) => {
      const partner =
        i.sender._id.toString() === userId.toString() ? i.receiver : i.sender;

      return partner;
    })
    .filter(
      (partner) => partner && !existingPartnerIds.has(partner._id.toString()),
    )
    .map((partner) => ({
      _id: `match_${partner._id}`,
      unreadCount: 0,
      lastMessage: null,
      partner,
    }));

  const conversations = [...enriched, ...matchedUsers];

  return sendSuccess(res, { conversations }, "Conversations fetched.", 200);

  return sendSuccess(
    res,
    { conversations: enriched },
    "Conversations fetched.",
    200,
  );
});

// ── GET /api/chat/:partnerId/messages ─────────────────────
exports.getMessages = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { partnerId } = req.params;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);

  // console.log("PLAN:", req.user.plan);

  const allowedPlans = ["premium", "gold", "diamond"];

  if (!allowedPlans.includes(req.user.plan)) {
    return next(
      new AppError(
        "Chat requires Premium plan or higher.",
        403,
        "UPGRADE_REQUIRED",
      ),
    );
  }

  if (!(await canChat(userId, partnerId))) {
    return next(
      new AppError(
        "You can only chat after both profiles accept each other's interest.",
        403,
        "INTEREST_REQUIRED",
      ),
    );
  }

  const conversationId = Message.getConversationId(userId, partnerId);

  const total = await Message.countDocuments({
    conversationId,
  });

  const messages = await Message.find({
    conversationId,
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("sender", "displayName photos");

  await Message.updateMany(
    {
      conversationId,
      receiver: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
  );

  return sendPaginated(
    res,
    messages.reverse(),
    total,
    page,
    limit,
    "Messages fetched.",
  );
});

// ── POST /api/chat/:partnerId/messages ────────────────────
exports.sendMessage = catchAsync(async (req, res, next) => {
  console.log("calling");
  const userId = req.user._id;
  const { partnerId } = req.params;
  const { content } = req.body;

  const allowedPlans = ["premium", "gold", "diamond"];

  if (!allowedPlans.includes(req.user.plan)) {
    return next(
      new AppError(
        "Chat requires Premium plan or higher.",
        403,
        "UPGRADE_REQUIRED",
      ),
    );
  }

  if (!(await canChat(userId, partnerId))) {
    return next(
      new AppError(
        "Interest must be accepted before chatting.",
        403,
        "INTEREST_REQUIRED",
      ),
    );
  }

  if (!content?.trim()) {
    return next(new AppError("Message cannot be empty.", 400, "EMPTY_MESSAGE"));
  }

  const conversationId = Message.getConversationId(userId, partnerId);

  const message = await Message.create({
    conversationId,
    sender: userId,
    receiver: partnerId,
    content: content.trim().slice(0, 2000),
  });

  await message.populate("sender", "displayName photos");

  const io = req.app.get("io");
  const partner = await User.findById(partnerId).select("socketId");

  if (io && partner?.socketId) {
    io.to(partner.socketId).emit("new_message", message);
  }

  return sendSuccess(res, { message }, "Message sent.", 201);
});

// ── DELETE /api/chat/messages/:messageId ──────────────────
exports.deleteMessage = catchAsync(async (req, res, next) => {
  const msg = await Message.findOne({
    _id: req.params.messageId,
    sender: req.user._id,
  });
  if (!msg)
    return next(
      new AppError(
        "Message not found or not yours to delete.",
        404,
        "NOT_FOUND",
      ),
    );
  msg.isDeleted = true;
  msg.deletedAt = new Date();
  msg.content = "[Message deleted]";
  await msg.save();
  return sendSuccess(res, {}, "Message deleted.", 200);
});
exports.editMessage = catchAsync(async (req, res, next) => {
  const { content } = req.body;

  const msg = await Message.findOne({
    _id: req.params.messageId,
    sender: req.user._id,
    isDeleted: false,
  });

  if (!msg) {
    return next(
      new AppError("Message not found or not yours to edit.", 404, "NOT_FOUND"),
    );
  }

  msg.content = content.trim().slice(0, 2000);
  msg.isEdited = true;
  msg.editedAt = new Date();

  await msg.save();

  return sendSuccess(res, { message: msg }, "Message updated.", 200);
});
