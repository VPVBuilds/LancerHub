const express = require('express');
const router  = express.Router();
const {
  getInvoices, getInvoice, createInvoice,
  updateInvoice, sendInvoice, cancelInvoice, getInvoiceStats,
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');

router.get( '/',            protect, getInvoices);
router.get( '/stats',       protect, getInvoiceStats);
router.get( '/:id',         protect, getInvoice);
router.post('/',            protect, authorize('freelancer'), createInvoice);
router.put( '/:id',         protect, updateInvoice);
router.put( '/:id/send',    protect, sendInvoice);
router.put( '/:id/cancel',  protect, cancelInvoice);

module.exports = router;
