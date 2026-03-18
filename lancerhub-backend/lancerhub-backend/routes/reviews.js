const express = require('express');
const router  = express.Router();
const { createReview, getUserReviews, deleteReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.post('/',              protect, createReview);
router.get( '/user/:userId',  getUserReviews);
router.delete('/:id',         protect, authorize('admin'), deleteReview);

module.exports = router;
