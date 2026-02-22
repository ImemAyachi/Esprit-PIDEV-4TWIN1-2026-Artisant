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
    .post(protect, authorize('Expert', 'Admin'), createDocument);

router.route('/:id')
    .get(getDocument)
    .put(protect, authorize('Expert', 'Admin'), updateDocument)
    .delete(protect, authorize('Expert', 'Admin'), deleteDocument);

router.route('/:id/favorite')
    .put(protect, favoriteDocument);

module.exports = router;
