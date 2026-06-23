// File: src/models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    type: {
      type: String,
      enum: ["text", "image", "system"],
      default: "text",
    },

    isRead: { type: Boolean, default: false },
    readAt: Date,

    // Delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,

    // Edit
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

messageSchema.statics.getConversationId = function (id1, id2) {
  return [id1.toString(), id2.toString()].sort().join("_");
};

module.exports = mongoose.model("Message", messageSchema);
