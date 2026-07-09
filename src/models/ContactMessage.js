// File: src/models/ContactMessage.js
const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
    phone: { type: String, trim: true, maxlength: 20 },
    subject: { type: String, trim: true, maxlength: 150, default: "General Inquiry" },
    message: { type: String, required: true, trim: true, maxlength: 2000 },

    // Linked automatically if the sender was logged in when they submitted the form
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    status: {
      type: String,
      enum: ["new", "read", "replied", "archived"],
      default: "new",
    },

    adminNotes: { type: String, maxlength: 1000 },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    repliedAt: Date,

    // Basic spam/abuse context, captured server-side (not user input)
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true },
);

contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ email: 1 });

module.exports = mongoose.model("ContactMessage", contactMessageSchema);