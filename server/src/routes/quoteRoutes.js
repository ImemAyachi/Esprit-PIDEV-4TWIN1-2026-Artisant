const express = require('express');
const {
    createQuote,
    getMyQuotes,
    updateQuote,
    deleteQuote
} = require('../controllers/quoteController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('artisan', 'admin'));

router.post('/', createQuote);
router.get('/my', getMyQuotes);
router.put('/:id', updateQuote);
router.delete('/:id', deleteQuote);

module.exports = router;
