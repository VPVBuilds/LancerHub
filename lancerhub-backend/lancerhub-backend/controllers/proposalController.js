const Proposal = require('../models/Proposal');
const Job = require('../models/Job');
const { notifyUser } = require('../config/socket');
const { io } = require('../server');

// @route   POST /api/proposals
// @access  Private (freelancer)
exports.submitProposal = async (req, res, next) => {
  try {
    const job = await Job.findById(req.body.job);
    if (!job || job.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Job is not open for proposals' });
    }
    if (job.client.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot apply to your own job' });
    }

    // Check for duplicate
    const existing = await Proposal.findOne({ job: req.body.job, freelancer: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already applied to this job' });
    }

    req.body.freelancer = req.user.id;
    const proposal = await Proposal.create(req.body);

    // Increment job proposal count
    await Job.findByIdAndUpdate(req.body.job, { $inc: { proposalCount: 1 } });

    // Real-time notify the client
    notifyUser(io, job.client.toString(), 'notification:new_proposal', {
      jobId: job._id,
      jobTitle: job.title,
      freelancerName: req.user.name,
    });

    res.status(201).json({ success: true, proposal });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/proposals/job/:jobId
// @access  Private (job owner)
exports.getJobProposals = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    const proposals = await Proposal.find({ job: req.params.jobId })
      .populate('freelancer', 'name avatar title hourlyRate avgRating totalReviews skills jobsCompleted')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: proposals.length, proposals });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/proposals/my
// @access  Private (freelancer)
exports.getMyProposals = async (req, res, next) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user.id })
      .populate('job', 'title status budgetMin budgetMax client')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: proposals.length, proposals });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/proposals/:id/accept
// @access  Private (client)
exports.acceptProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('job');
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    if (proposal.job.client.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    proposal.status = 'accepted';
    await proposal.save();

    // Update job status and hired freelancer
    await Job.findByIdAndUpdate(proposal.job._id, {
      status: 'in_progress',
      hiredFreelancer: proposal.freelancer,
    });

    // Reject all other proposals for this job
    await Proposal.updateMany(
      { job: proposal.job._id, _id: { $ne: proposal._id } },
      { status: 'rejected' }
    );

    // Notify the freelancer
    notifyUser(io, proposal.freelancer.toString(), 'notification:proposal_accepted', {
      jobTitle: proposal.job.title,
    });

    res.json({ success: true, proposal });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/proposals/:id/reject
// @access  Private (client)
exports.rejectProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('job');
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    if (proposal.job.client.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    proposal.status = 'rejected';
    proposal.clientNote = req.body.note || '';
    await proposal.save();

    notifyUser(io, proposal.freelancer.toString(), 'notification:proposal_rejected', {
      jobTitle: proposal.job.title,
    });

    res.json({ success: true, proposal });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/proposals/:id
// @access  Private (freelancer — withdraw)
exports.withdrawProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    if (proposal.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    if (proposal.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'Cannot withdraw an accepted proposal' });
    }

    proposal.status = 'withdrawn';
    await proposal.save();
    await Job.findByIdAndUpdate(proposal.job, { $inc: { proposalCount: -1 } });

    res.json({ success: true, message: 'Proposal withdrawn' });
  } catch (err) {
    next(err);
  }
};
