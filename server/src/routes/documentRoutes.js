import express from 'express';
import { getAllDocuments,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    toggleFavorite,
    getDocumentHistory,
    logConsultation
 } from '../controllers/documentController.js';

import { protect, authorize  } from '../middleware/auth.js';

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

export default router;


