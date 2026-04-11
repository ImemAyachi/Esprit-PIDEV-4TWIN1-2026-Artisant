import express from 'express';
import { getStats  } from '../controllers/statsController.js';
import { getProducts  } from '../controllers/productController.js';

const router = express.Router();

router.get('/stats', getStats);
router.get('/recent-products', getProducts); // Reuse getProducts, client can limit it

export default router;
