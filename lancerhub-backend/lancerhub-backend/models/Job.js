const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['development', 'design', 'writing', 'marketing', 'video', 'data', 'other'],
    },
    skills: [{ type: String }],

    // ── Budget ────────────────────────────────
    budgetType: {
      type: String,
      enum: ['fixed', 'hourly'],
      default: 'fixed',
    },
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number },

    // ── Duration ──────────────────────────────
    duration: {
      type: String,
      enum: ['less_than_week', '1_2_weeks', '2_4_weeks', '1_3_months', '3_plus_months'],
      default: '2_4_weeks',
    },

    // ── Status ────────────────────────────────
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },

    // Hired freelancer (set when a proposal is accepted)
    hiredFreelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Attachments ───────────────────────────
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // ── Visibility & stats ────────────────────
    isRemote:       { type: Boolean, default: true },
    location:       { type: String, default: '' },
    proposalCount:  { type: Number, default: 0 },
    viewCount:      { type: Number, default: 0 },
    isActive:       { type: Boolean, default: true },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  { timestamps: true }
);

// ── Full-text search index ────────────────────
JobSchema.index({ title: 'text', description: 'text', skills: 'text' });
JobSchema.index({ category: 1, status: 1 });
JobSchema.index({ client: 1 });
JobSchema.index({ budgetMin: 1, budgetMax: 1 });
JobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Job', JobSchema);
