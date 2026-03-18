const mongoose = require('mongoose');

// ── Conversation ──────────────────────────────
const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    // Optional: link conversation to a job
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: { type: Date, default: Date.now },
    // Unread count per participant
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

// ── Message ───────────────────────────────────
const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [5000, 'Message too long'],
    },
    type: {
      type: String,
      enum: ['text', 'file', 'image', 'system'],
      default: 'text',
    },
    // For file/image messages
    attachment: {
      filename: String,
      url: String,
      size: Number,
      mimeType: String,
    },
    isRead: { type: Boolean, default: false },
    readAt:  { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: 1 });
MessageSchema.index({ sender: 1 });

const Conversation = mongoose.model('Conversation', ConversationSchema);
const Message      = mongoose.model('Message', MessageSchema);

module.exports = { Conversation, Message };
