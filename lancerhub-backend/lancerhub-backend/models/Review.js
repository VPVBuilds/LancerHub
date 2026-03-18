const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      maxlength: [1500, 'Review cannot exceed 1500 characters'],
    },
    // Sub-ratings
    communication: { type: Number, min: 1, max: 5 },
    quality:        { type: Number, min: 1, max: 5 },
    timeliness:     { type: Number, min: 1, max: 5 },
    // Type: client reviewing freelancer or freelancer reviewing client
    reviewType: {
      type: String,
      enum: ['client_to_freelancer', 'freelancer_to_client'],
      required: true,
    },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One review per job per reviewer
ReviewSchema.index({ job: 1, reviewer: 1 }, { unique: true });
ReviewSchema.index({ reviewee: 1, rating: -1 });

// After save, update user's avgRating
ReviewSchema.post('save', async function () {
  const User = mongoose.model('User');
  const reviews = await mongoose.model('Review').find({ reviewee: this.reviewee });
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await User.findByIdAndUpdate(this.reviewee, {
    avgRating: Math.round(avg * 10) / 10,
    totalReviews: reviews.length,
  });
});

module.exports = mongoose.model('Review', ReviewSchema);
