const express = require('express');
const {
    createQuote,
    getMyQuotes,
    updateQuote,
    deleteQuote,
    acceptQuote,
    reactivateQuote
} = require('../controllers/quoteController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public acceptance route (if using token, but here let's allow it if we have ID for demo)
router.patch('/:id/accept', acceptQuote);

router.use(protect);
router.use(authorize('artisan', 'admin'));

router.post('/', createQuote);
router.get('/my', getMyQuotes);
router.put('/:id', updateQuote);
router.delete('/:id', deleteQuote);
router.patch('/:id/reactivate', reactivateQuote);

module.exports = router;
