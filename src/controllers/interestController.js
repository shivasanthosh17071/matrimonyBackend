// File: src/controllers/interestController.js
const Interest = require("../models/Interest");
const User = require("../models/User");
const { catchAsync, AppError } = require("../utils/AppError");
const { sendSuccess, sendPaginated } = require("../utils/apiResponse");
const { sendInterestNotificationEmail } = require("../services/emailService");
const logger = require("../utils/logger");
// GET /api/interests/status/:userId

exports.getInterestStatus = catchAsync(async (req, res) => {
  const interest = await Interest.findOne({
    sender: req.user._id,
    receiver: req.params.userId,
  }).select("status");

  return sendSuccess(
    res,
    {
      sent: !!interest,
      status: interest?.status || null,
    },
    "Interest status fetched.",
  );
});
exports.sendInterest = catchAsync(async (req, res, next) => {
  const { receiverId, message } = req.body;
  const sender = req.user;
  if (sender._id.toString() === receiverId)
    return next(
      new AppError("Cannot send interest to yourself.", 400, "SELF_INTEREST"),
    );

  const receiver = await User.findById(receiverId);
  if (!receiver?.isActive)
    return next(new AppError("Profile not found.", 404, "NOT_FOUND"));
  if (await Interest.findOne({ sender: sender._id, receiver: receiverId }))
    return next(
      new AppError(
        "Interest already sent to this profile.",
        409,
        "ALREADY_SENT",
      ),
    );

  const interest = await Interest.create({
    sender: sender._id,
    receiver: receiverId,
    message: message?.trim().slice(0, 300),
  });

  // Real-time + email notification
  const io = req.app.get("io");
  if (io && receiver.socketId) {
    io.to(receiver.socketId).emit("new_interest", {
      from: { _id: sender._id, displayName: sender.displayName },
      interestId: interest._id,
      message: interest.message,
    });
  }
  if (receiver.email) {
    sendInterestNotificationEmail(
      receiver,
      sender.displayName || sender.fullName,
    ).catch((e) => logger.error(`Interest email: ${e.message}`));
  }

  return sendSuccess(
    res,
    { interestId: interest._id },
    "Interest sent successfully.",
    201,
  );
});

exports.respondToInterest = catchAsync(async (req, res, next) => {
  const { action } = req.body;
  if (!["accepted", "declined"].includes(action))
    return next(
      new AppError(
        "Action must be accepted or declined.",
        400,
        "INVALID_ACTION",
      ),
    );

  const interest = await Interest.findOne({
    _id: req.params.id,
    receiver: req.user._id,
  });
  if (!interest)
    return next(new AppError("Interest not found.", 404, "NOT_FOUND"));
  if (interest.status !== "pending")
    return next(
      new AppError(`Already ${interest.status}.`, 409, "ALREADY_RESPONDED"),
    );

  interest.status = action;
  interest.respondedAt = new Date();
  await interest.save();

  const io = req.app.get("io");
  const sender = await User.findById(interest.sender).select("socketId");
  if (io && sender?.socketId) {
    io.to(sender.socketId).emit("interest_response", {
      interestId: interest._id,
      status: action,
      from: { _id: req.user._id, displayName: req.user.displayName },
    });
  }
  return sendSuccess(res, { status: action }, `Interest ${action}.`, 200);
});

exports.getInbox = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1),
    limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const filter = {
    receiver: req.user._id,
    status: req.query.status || "pending",
  };
  const total = await Interest.countDocuments(filter);
  const items = await Interest.find(filter)
    .populate(
      "sender",
      "displayName age city district occupation photos plan mobileVerified",
    )
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return sendPaginated(res, items, total, page, limit, "Inbox fetched.");
});

exports.getSent = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1),
    limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const filter = { sender: req.user._id };
  const total = await Interest.countDocuments(filter);
  const items = await Interest.find(filter)
    .populate(
      "receiver",
      "displayName age city district occupation photos plan mobileVerified",
    )
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return sendPaginated(
    res,
    items,
    total,
    page,
    limit,
    "Sent interests fetched.",
  );
});

exports.getMutualMatches = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const accepted = await Interest.find({
    $or: [
      { sender: userId, status: "accepted" },
      { receiver: userId, status: "accepted" },
    ],
  }).populate(
    "sender receiver",
    "displayName age city district occupation photos plan isOnline lastSeen mobileVerified",
  );
  const mutual = accepted.map((i) => {
    const partner =
      i.sender._id.toString() === userId.toString() ? i.receiver : i.sender;
    return {
      partner,
      interestId: i._id,
      matchedAt: i.respondedAt || i.updatedAt,
    };
  });
  return sendSuccess(res, { matches: mutual }, "Mutual matches fetched.", 200);
});
