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

