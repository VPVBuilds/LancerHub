const User = require('../models/User');
const Job  = require('../models/Job');

// @route   GET /api/users
// @access  Public  — browse freelancers
exports.getFreelancers = async (req, res, next) => {
  try {
    const {
      search, skills, location, availability,
      minRate, maxRate, minRating,
      sortBy = 'avgRating', order = 'desc',
      page = 1, limit = 12,
    } = req.query;

    const query = { role: 'freelancer', isActive: true };

    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { skills:{ $regex: search, $options: 'i' } },
      ];
    }
    if (skills)       query.skills      = { $in: skills.split(',').map((s) => s.trim()) };
    if (location)     query.location    = { $regex: location, $options: 'i' };
    if (availability) query.availability = availability;
    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = Number(minRate);
      if (maxRate) query.hourlyRate.$lte = Number(maxRate);
    }
    if (minRating) query.avgRating = { $gte: Number(minRating) };

    const skip  = (Number(page) - 1) * Number(limit);
    const sort  = { [sortBy]: order === 'asc' ? 1 : -1 };

    const [freelancers, total] = await Promise.all([
      User.find(query)
        .select('name avatar title bio location skills hourlyRate availability avgRating totalReviews jobsCompleted isVerified createdAt')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: freelancers.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      freelancers,
    });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/users/:id
// @access  Public
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -resetPasswordToken -resetPasswordExpire -emailVerifyToken -stripeCustomerId -stripeAccountId'
    );
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'title', 'bio', 'location', 'website',
      'skills', 'languages', 'hourlyRate', 'availability', 'portfolio',
    ];
    const updates = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true, runValidators: true,
    });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/users/avatar
// @access  Private
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file?.cloudinaryUrl) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: req.file.cloudinaryUrl },
      { new: true }
    );
    res.json({ success: true, avatar: user.avatar });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/users/:id/portfolio
// @access  Public
exports.getPortfolio = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('portfolio name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, portfolio: user.portfolio });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/users/dashboard
// @access  Private
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (req.user.role === 'freelancer') {
      const [user, activeJobs] = await Promise.all([
        User.findById(userId).select('totalEarned jobsCompleted avgRating totalReviews successRate'),
        Job.find({ hiredFreelancer: userId, status: 'in_progress' })
           .populate('client', 'name avatar')
           .limit(5),
      ]);
      return res.json({ success: true, user, activeJobs });
    }

    // Client dashboard
    const [myJobs, totalSpent] = await Promise.all([
      Job.find({ client: userId }).sort({ createdAt: -1 }).limit(5),
      User.findById(userId).select('totalSpent'),
    ]);
    res.json({ success: true, myJobs, totalSpent: totalSpent?.totalSpent || 0 });
  } catch (err) {
    next(err);
  }
};
