const express = require('express');
const router = express.Router();
const { 
    getProducts, 
    createProduct, 
    updateProduct, 
    bulkUpdateProducts,
    addProductReview,
    getLowStockProducts 
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
    .get(getProducts)
    .post(protect, authorize('manufacturer', 'admin'), createProduct);

router.route('/bulk')
    .patch(protect, authorize('manufacturer', 'admin'), bulkUpdateProducts);

router.route('/low-stock')
    .get(protect, authorize('manufacturer', 'admin'), getLowStockProducts);

router.route('/:id')
    .put(protect, authorize('manufacturer', 'admin'), updateProduct);

router.route('/:id/review')
    .post(protect, addProductReview);

module.exports = router;
