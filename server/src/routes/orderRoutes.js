import express from 'express';
const router = express.Router();
import { createOrder, 
    getMyOrders, 
    getManufacturerOrders,
    updateOrderStatus,
    getOrder,
    getOrderAnalytics
 } from '../controllers/orderController.js';
import { protect, authorize  } from '../middleware/auth.js';

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


export default router;

