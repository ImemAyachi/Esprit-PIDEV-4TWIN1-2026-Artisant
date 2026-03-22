const express = require('express');
const {
    createInvoice,
    getMyInvoices,
    recordPayment,
    voidInvoice,
    checkOverdue,
    getFinancialSummary
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('artisan', 'admin', 'manufacturer'));

router.post('/', createInvoice);
router.get('/my', getMyInvoices);
router.get('/summary', getFinancialSummary);
router.patch('/:id/payment', recordPayment);
router.patch('/:id/void', voidInvoice);
router.get('/check-overdue', checkOverdue);

module.exports = router;
