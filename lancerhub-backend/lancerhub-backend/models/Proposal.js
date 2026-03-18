const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coverLetter: {
      type: String,
      required: [true, 'Cover letter is required'],
      maxlength: [3000, 'Cover letter cannot exceed 3000 characters'],
    },
    bidAmount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [1, 'Bid must be at least $1'],
    },
    deliveryDays: {
      type: Number,
      required: [true, 'Delivery time is required'],
      min: [1, 'Delivery must be at least 1 day'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
    },
    // Client notes when rejecting/accepting
    clientNote: { type: String, default: '' },

    // Milestones (optional breakdown)
    milestones: [
      {
        title:       { type: String, required: true },
        description: { type: String },
        amount:      { type: Number, required: true },
        dueDate:     { type: Date },
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'submitted', 'approved'],
          default: 'pending',
        },
      },
    ],
  },
  { timestamps: true }
);

// One proposal per freelancer per job
ProposalSchema.index({ job: 1, freelancer: 1 }, { unique: true });
ProposalSchema.index({ freelancer: 1, status: 1 });
ProposalSchema.index({ job: 1, status: 1 });

module.exports = mongoose.model('Proposal', ProposalSchema);
