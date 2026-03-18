const Review = require('../models/Review');
const Job    = require('../models/Job');

// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { jobId, revieweeId, rating, comment, communication, quality, timeliness, reviewType } = req.body;

    const job = await Job.findById(jobId);
    if (!job || job.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Job must be completed before reviewing' });
    }

    // Verify reviewer is part of the job
    const isClient     = job.client.toString()           === req.user.id;
    const isFreelancer = job.hiredFreelancer?.toString() === req.user.id;
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ success: false, message: 'Not authorised to review this job' });
    }

    const existing = await Review.findOne({ job: jobId, reviewer: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this job' });
    }

    const review = await Review.create({
      job: jobId,
      reviewer: req.user.id,
      reviewee: revieweeId,
      rating,
      comment,
      communication,
      quality,
      timeliness,
      reviewType: isClient ? 'client_to_freelancer' : 'freelancer_to_client',
    });

    await review.populate('reviewer', 'name avatar');
    res.status(201).json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/reviews/user/:userId
// @access  Public
exports.getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, reviewType } = req.query;
    const query = { reviewee: req.params.userId, isPublic: true };
    if (reviewType) query.reviewType = reviewType;

    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('reviewer', 'name avatar title')
        .populate('job', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(query),
    ]);

    res.json({ success: true, reviews, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/reviews/:id
// @access  Private (admin only)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    await review.deleteOne();
    res.json({ success: true, message: 'Review removed' });
  } catch (err) {
    next(err);
  }
};
