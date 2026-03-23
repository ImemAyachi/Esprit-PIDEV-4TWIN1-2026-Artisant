const express = require('express');
const router = express.Router();
const { 
    createOrder, 
    getMyOrders, 
    getManufacturerOrders,
    updateOrderStatus,
    getOrder,
    getOrderAnalytics
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .post(protect, createOrder);

router.route('/my')
    .get(protect, getMyOrders);

router.route('/manufacturer')
    .get(protect, authorize('manufacturer', 'admin'), getManufacturerOrders);

router.route('/summary')
    .get(protect, getOrderAnalytics);

router.route('/:id')
    .get(protect, getOrder);

router.route('/:id/status')
    .patch(protect, authorize('manufacturer', 'admin'), updateOrderStatus);


module.exports = router;

