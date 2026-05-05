<<<<<<< HEAD
const express = require('express');
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    generateAIDescription,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/ai-description', generateAIDescription);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
=======
import express from 'express';
const router = express.Router();
import { getProducts, 
    createProduct, 
    updateProduct,
    deleteProduct,
    getLowStockProducts 
 } from '../controllers/productController.js';
import { protect, authorize  } from '../middleware/auth.js';

router.route('/')
    .get(getProducts)
    .post(protect, authorize('manufacturer', 'admin'), createProduct);

router.route('/low-stock')
    .get(protect, authorize('manufacturer', 'admin'), getLowStockProducts);

router.route('/:id')
    .put(protect, authorize('manufacturer', 'admin'), updateProduct)
    .delete(protect, authorize('manufacturer', 'admin'), deleteProduct);

export default router;

>>>>>>> imem
