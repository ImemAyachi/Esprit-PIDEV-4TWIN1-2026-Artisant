const express = require('express');
const {
    createQuote,
    getMyQuotes,
    updateQuote,
    deleteQuote,
    acceptQuote
} = require('../controllers/quoteController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Acceptance route
router.patch('/:id/accept', acceptQuote);

router.use(protect);
router.use(authorize('artisan', 'admin'));

router.post('/', createQuote);
router.get('/my', getMyQuotes);
router.put('/:id', updateQuote);
router.delete('/:id', deleteQuote);

module.exports = router;

