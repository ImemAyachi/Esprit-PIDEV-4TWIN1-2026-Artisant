const express = require('express');
const { getStats } = require('../controllers/statsController');
const { getProducts } = require('../controllers/productController');

const router = express.Router();

router.get('/stats', getStats);
router.get('/recent-products', getProducts); // Reuse getProducts, client can limit it

module.exports = router;
