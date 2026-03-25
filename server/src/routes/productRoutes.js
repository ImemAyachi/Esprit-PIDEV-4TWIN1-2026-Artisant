const express = require('express');
const router = express.Router();
const { 
    getProducts, 
    createProduct, 
    updateProduct,
    deleteProduct,
    getLowStockProducts 
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(getProducts)
    .post(protect, authorize('manufacturer', 'admin'), createProduct);

router.route('/low-stock')
    .get(protect, authorize('manufacturer', 'admin'), getLowStockProducts);

router.route('/:id')
    .put(protect, authorize('manufacturer', 'admin'), updateProduct)
    .delete(protect, authorize('manufacturer', 'admin'), deleteProduct);

module.exports = router;

