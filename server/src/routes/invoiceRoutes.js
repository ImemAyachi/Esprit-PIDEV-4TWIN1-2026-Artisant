const express = require('express');
const {
    convertToInvoice,
    getMyInvoices,
    getInvoiceSummary
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('artisan', 'admin'));

router.post('/convert/:quoteId', convertToInvoice);
router.get('/my', getMyInvoices);
router.get('/summary', getInvoiceSummary);

module.exports = router;
