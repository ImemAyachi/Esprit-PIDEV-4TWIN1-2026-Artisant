const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create an order
// @route   POST /api/orders
// @access  authenticated
const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No items in order' });
        }

        // Fetch product prices from DB to avoid price tampering
        let totalAmount = 0;
        const resolvedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
            }
            const price = product.price;
            totalAmount += price * item.quantity;
            resolvedItems.push({ product: item.product, quantity: item.quantity, price });
        }

        const order = await Order.create({
            user: req.user.id,
            items: resolvedItems,
            totalAmount,
            shippingAddress,
        });

        await order.populate('items.product', 'name images');
        res.status(201).json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get current user's orders
// @route   GET /api/orders/my
// @access  authenticated
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('items.product', 'name images price')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  authenticated (owner or admin)
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product', 'name images price');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  admin / manufacturer
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate('items.product', 'name');

        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  admin
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('items.product', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { createOrder, getMyOrders, getOrderById, updateOrderStatus, getAllOrders };
