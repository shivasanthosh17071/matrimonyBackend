// File: src/models/Report.js
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reported: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: [
        "fake_profile",
        "inappropriate_photo",
        "harassment",
        "spam",
        "wrong_info",
        "already_married",
        "other",
      ],
      required: true,
    },
    description: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ["open", "reviewed", "resolved", "dismissed"],
      default: "open",
    },
    adminAction: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  { timestamps: true },
);

reportSchema.index({ reported: 1, status: 1 });

module.exports = mongoose.model("Report", reportSchema);
