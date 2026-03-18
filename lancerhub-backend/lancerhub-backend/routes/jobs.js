const express = require('express');
const router  = express.Router();
const {
  getJobs, getJob, createJob, updateJob, deleteJob, getMyJobs,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/',    getJobs);    // GET /api/jobs?category=dev&budgetMin=500&search=react
router.get('/my',  protect, getMyJobs); // GET /api/jobs/my  (client's own jobs)
router.get('/:id', getJob);     // GET /api/jobs/:id

// Private
router.post('/',       protect, authorize('client', 'admin'), createJob);
router.put('/:id',     protect, updateJob);
router.delete('/:id',  protect, deleteJob);

module.exports = router;
