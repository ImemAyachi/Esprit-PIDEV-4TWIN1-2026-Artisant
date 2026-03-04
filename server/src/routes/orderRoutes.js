const express = require('express');
const {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrders,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), getAllOrders);
router.post('/', createOrder);
router.get('/my', getMyOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', authorize('admin', 'manufacturer'), updateOrderStatus);

module.exports = router;
