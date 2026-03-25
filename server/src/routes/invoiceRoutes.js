const express = require('express');
const {
    createInvoice,
    getMyInvoices,
    updateInvoice,
    deleteInvoice,
    getFinancialSummary,
    recordPayment,
    voidInvoice
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
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);


module.exports = router;

