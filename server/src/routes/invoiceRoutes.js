import express from 'express';
import { createInvoice,
    getMyInvoices,
    updateInvoice,
    deleteInvoice,
    getFinancialSummary,
    recordPayment,
    voidInvoice
 } from '../controllers/invoiceController.js';

import { protect, authorize  } from '../middleware/auth.js';

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


export default router;

