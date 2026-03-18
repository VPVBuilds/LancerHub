const Invoice = require('../models/Invoice');

// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {
      $or: [{ freelancer: req.user.id }, { client: req.user.id }],
    };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('freelancer', 'name email avatar')
        .populate('client',     'name email avatar')
        .populate('job',        'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Invoice.countDocuments(query),
    ]);

    res.json({ success: true, invoices, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('freelancer', 'name email avatar location')
      .populate('client',     'name email avatar location')
      .populate('job',        'title');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const isParty =
      invoice.freelancer._id.toString() === req.user.id ||
      invoice.client._id.toString()     === req.user.id;
    if (!isParty && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    // Mark as viewed if client opens it
    if (invoice.client._id.toString() === req.user.id && invoice.status === 'sent') {
      invoice.status = 'viewed';
      await invoice.save();
    }

    res.json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/invoices
// @access  Private (freelancer)
exports.createInvoice = async (req, res, next) => {
  try {
    req.body.freelancer = req.user.id;

    // Calculate totals
    const items = req.body.items || [];
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * (req.body.taxRate || 0)) / 100;
    req.body.subtotal    = subtotal;
    req.body.taxAmount   = taxAmount;
    req.body.totalAmount = subtotal + taxAmount;

    const invoice = await Invoice.create(req.body);
    await invoice.populate('client', 'name email');
    res.status(201).json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/invoices/:id
// @access  Private (freelancer / owner)
exports.updateInvoice = async (req, res, next) => {
  try {
    let invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    if (['paid', 'cancelled'].includes(invoice.status)) {
      return res.status(400).json({ success: false, message: `Cannot edit a ${invoice.status} invoice` });
    }

    // Recalculate totals if items changed
    if (req.body.items) {
      const subtotal = req.body.items.reduce((sum, i) => sum + i.amount, 0);
      const taxAmount = (subtotal * (req.body.taxRate || invoice.taxRate || 0)) / 100;
      req.body.subtotal    = subtotal;
      req.body.taxAmount   = taxAmount;
      req.body.totalAmount = subtotal + taxAmount;
    }

    invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/invoices/:id/send
// @access  Private (freelancer)
exports.sendInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('client', 'name email');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    invoice.status = 'sent';
    await invoice.save();

    // TODO: send email to client via nodemailer (see utils/email.js)

    res.json({ success: true, invoice, message: `Invoice sent to ${invoice.client.email}` });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/invoices/:id/cancel
// @access  Private (freelancer)
exports.cancelInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a paid invoice' });
    }
    invoice.status = 'cancelled';
    await invoice.save();
    res.json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/invoices/stats
// @access  Private (freelancer)
exports.getInvoiceStats = async (req, res, next) => {
  try {
    const stats = await Invoice.aggregate([
      { $match: { freelancer: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
};
