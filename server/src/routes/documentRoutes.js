const express = require('express');
const {
    getAllDocuments,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    favoriteDocument,
    downloadDocument,
    shareDocument,
    getConsultationHistory,
    revertDocumentVersion
} = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/history', protect, getConsultationHistory);

router.route('/')
    .get(getAllDocuments)
    .post(protect, authorize('expert', 'admin', 'manufacturer'), createDocument);

router.route('/:id')
    .get(protect, getDocument)
    .put(protect, authorize('expert', 'admin', 'manufacturer'), updateDocument)
    .delete(protect, authorize('expert', 'admin', 'manufacturer'), deleteDocument);

router.put('/:id/favorite', protect, favoriteDocument);
router.get('/:id/download', protect, downloadDocument);
router.post('/:id/share', protect, shareDocument);
router.post('/:id/revert/:versionId', protect, authorize('expert', 'admin', 'manufacturer'), revertDocumentVersion);

module.exports = router;
