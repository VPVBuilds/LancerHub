const Job = require('../models/Job');
const Proposal = require('../models/Proposal');

// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res, next) => {
  try {
    const {
      search, category, budgetMin, budgetMax,
      duration, budgetType, skills,
      sortBy = 'createdAt', order = 'desc',
      page = 1, limit = 12,
    } = req.query;

    const query = { status: 'open', isActive: true };

    // Full-text search
    if (search) {
      query.$text = { $search: search };
    }
    if (category)    query.category = category;
    if (budgetType)  query.budgetType = budgetType;
    if (duration)    query.duration = duration;
    if (skills) {
      const skillArr = skills.split(',').map((s) => s.trim());
      query.skills = { $in: skillArr };
    }
    if (budgetMin || budgetMax) {
      query.budgetMin = {};
      if (budgetMin) query.budgetMin.$gte = Number(budgetMin);
      if (budgetMax) query.budgetMin.$lte = Number(budgetMax);
    }

    const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('client', 'name avatar location isVerified avgRating')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit)),
      Job.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: jobs.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      jobs,
    });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('client', 'name avatar location isVerified avgRating totalReviews')
      .populate('hiredFreelancer', 'name avatar title');

    if (!job || !job.isActive) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Increment view count
    await Job.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json({ success: true, job });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/jobs
// @access  Private (client)
exports.createJob = async (req, res, next) => {
  try {
    req.body.client = req.user.id;
    const job = await Job.create(req.body);
    res.status(201).json({ success: true, job });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/jobs/:id
// @access  Private (owner)
exports.updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    res.json({ success: true, job });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/jobs/:id
// @access  Private (owner)
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/jobs/my
// @access  Private (client)
exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ client: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    next(err);
  }
};
