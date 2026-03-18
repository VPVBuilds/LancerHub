const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Invoice = require('../models/Invoice');
const User    = require('../models/User');

// @route   POST /api/payments/create-intent
// @access  Private (client)
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { invoiceId } = req.body;
    const invoice = await Invoice.findById(invoiceId).populate('freelancer', 'stripeAccountId');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.client.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice already paid' });
    }

    const amountInCents = Math.round(invoice.totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        invoiceId: invoice._id.toString(),
        freelancerId: invoice.freelancer._id.toString(),
        clientId: req.user.id,
      },
    });

    // Save intent ID to invoice
    invoice.stripePaymentIntentId = paymentIntent.id;
    await invoice.save();

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: invoice.totalAmount,
    });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/payments/webhook
// @access  Public (Stripe webhook — raw body)
exports.stripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        const invoice = await Invoice.findOne({ stripePaymentIntentId: intent.id });
        if (invoice) {
          invoice.status = 'paid';
          invoice.paidAt = new Date();
          invoice.stripeChargeId = intent.latest_charge;
          await invoice.save();

          // Update user earnings / spent
          await User.findByIdAndUpdate(invoice.freelancer, {
            $inc: { totalEarned: invoice.totalAmount, jobsCompleted: 1 },
          });
          await User.findByIdAndUpdate(invoice.client, {
            $inc: { totalSpent: invoice.totalAmount },
          });
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        console.warn(`❌ Payment failed for intent ${intent.id}`);
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({
      $or: [{ client: req.user.id }, { freelancer: req.user.id }],
      status: 'paid',
    })
      .populate('freelancer', 'name avatar')
      .populate('client',     'name avatar')
      .populate('job',        'title')
      .sort({ paidAt: -1 });

    res.json({ success: true, invoices });
  } catch (err) {
    next(err);
  }
};
