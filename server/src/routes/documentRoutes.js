const express = require('express');
const {
    getAllDocuments,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    toggleFavorite,
    getDocumentHistory,
    logConsultation
} = require('../controllers/documentController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/history', protect, getDocumentHistory);
router.post('/:id/consult', protect, logConsultation);


router.route('/')

    .get(getAllDocuments)
    .post(protect, authorize('expert', 'admin', 'manufacturer'), createDocument);

router.route('/:id')
    .get(protect, getDocument)
    .put(protect, authorize('expert', 'admin', 'manufacturer'), updateDocument)
    .delete(protect, authorize('expert', 'admin', 'manufacturer'), deleteDocument);

router.route('/:id/favorite')
    .put(protect, toggleFavorite);

module.exports = router;


