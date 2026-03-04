const express = require('express');
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    generateAIDescription,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// AI description — must be before /:id to avoid route conflict
router.post('/ai-description', protect, authorize('manufacturer', 'admin'), generateAIDescription);

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected CRUD
router.post('/', protect, authorize('manufacturer', 'admin'), createProduct);
router.put('/:id', protect, authorize('manufacturer', 'admin'), updateProduct);
router.delete('/:id', protect, authorize('manufacturer', 'admin'), deleteProduct);

module.exports = router;
