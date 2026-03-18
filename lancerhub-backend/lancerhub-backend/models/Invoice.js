const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    items: [
      {
        description: { type: String, required: true },
        quantity:    { type: Number, required: true, default: 1 },
        rate:        { type: Number, required: true },
        amount:      { type: Number, required: true },
      },
    ],
    subtotal:    { type: Number, required: true },
    taxRate:     { type: Number, default: 0 },    // percentage e.g. 18 for 18%
    taxAmount:   { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    dueDate:   { type: Date, required: true },
    paidAt:    { type: Date },
    notes:     { type: String, maxlength: 1000, default: '' },

    // Stripe payment intent
    stripePaymentIntentId: { type: String, default: '' },
    stripeChargeId:        { type: String, default: '' },

    // PDF URL once generated
    pdfUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-generate invoice number before save
InvoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

InvoiceSchema.index({ freelancer: 1, status: 1 });
InvoiceSchema.index({ client: 1 });
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);
