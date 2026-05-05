import express from 'express';
import { createQuote,
    getMyQuotes,
    updateQuote,
    deleteQuote,
    acceptQuote
 } from '../controllers/quoteController.js';
import { protect, authorize  } from '../middleware/auth.js';

const router = express.Router();

// Acceptance route
router.patch('/:id/accept', acceptQuote);

router.use(protect);
router.use(authorize('artisan', 'admin'));

router.post('/', createQuote);
router.get('/my', getMyQuotes);
router.put('/:id', updateQuote);
router.delete('/:id', deleteQuote);

export default router;

