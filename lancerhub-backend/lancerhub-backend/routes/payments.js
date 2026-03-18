const express = require('express');
const router  = express.Router();
const {
  createPaymentIntent, stripeWebhook, getPaymentHistory,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// NOTE: /webhook uses raw body — mounted in server.js BEFORE express.json()
router.post('/webhook',        stripeWebhook);
router.post('/create-intent',  protect, createPaymentIntent);
router.get( '/history',        protect, getPaymentHistory);

module.exports = router;
