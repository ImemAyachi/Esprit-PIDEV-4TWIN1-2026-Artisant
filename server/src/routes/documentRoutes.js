const express = require('express');
const {
    getAllDocuments,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    favoriteDocument,
} = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(getAllDocuments)
    .post(protect, authorize('expert', 'admin'), createDocument);

router.route('/:id')
    .get(getDocument)
    .put(protect, authorize('expert', 'admin'), updateDocument)
    .delete(protect, authorize('expert', 'admin'), deleteDocument);

router.route('/:id/favorite')
    .put(protect, favoriteDocument);

module.exports = router;
