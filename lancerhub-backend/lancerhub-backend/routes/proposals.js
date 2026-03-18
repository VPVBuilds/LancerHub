const express = require('express');
const router  = express.Router();
const {
  submitProposal, getJobProposals, getMyProposals,
  acceptProposal, rejectProposal, withdrawProposal,
} = require('../controllers/proposalController');
const { protect, authorize } = require('../middleware/auth');

router.post('/',                          protect, authorize('freelancer'), submitProposal);
router.get('/my',                         protect, getMyProposals);
router.get('/job/:jobId',                 protect, getJobProposals);
router.put('/:id/accept',                 protect, acceptProposal);
router.put('/:id/reject',                 protect, rejectProposal);
router.delete('/:id',                     protect, withdrawProposal);

module.exports = router;
