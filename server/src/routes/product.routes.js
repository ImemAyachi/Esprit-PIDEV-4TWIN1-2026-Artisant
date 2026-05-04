/**
 * Routes Produits
 *
 * @swagger
 * tags:
 *   name: Products
 *   description: Catalogue de produits de construction
 */
import express from 'express';
import {
  getProducts, getProductById, createProduct,
  updateProduct, deleteProduct, getTopByCategory, getMyProducts, getLuckyDeals
} from '../controllers/product.controller.js';
import { mlSearchProductsGet, getDatasetStats } from '../controllers/aiMLSearch.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadProduct } from '../middleware/upload.middleware.js';

const router = express.Router();

// Routes publiques
router.get('/',               getProducts);
router.get('/ml-search',      mlSearchProductsGet);  // 🤖 Recherche IA ML
router.get('/dataset-stats',  getDatasetStats);       // 📊 Stats dataset
router.get('/lucky-deals',    getLuckyDeals);
router.get('/top/:category',  getTopByCategory);
router.get('/my',             protect, authorize('Fournisseur'), getMyProducts);
router.get('/:id',            getProductById);

// Routes protégées Fournisseur
router.post('/',
  protect,
  authorize('Fournisseur'),
  uploadProduct.array('media', 10), // Max 10 fichiers
  createProduct
);

router.put('/:id',
  protect,
  authorize('Fournisseur', 'SuperAdmin'),
  updateProduct
);

router.delete('/:id',
  protect,
  authorize('Fournisseur', 'SuperAdmin'),
  deleteProduct
);

export default router;
