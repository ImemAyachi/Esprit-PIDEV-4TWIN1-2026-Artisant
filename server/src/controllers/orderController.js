const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Checkout and Create Order (Multi-step Logic)
// @route   POST /api/orders
// @access  Private (Artisan/Expert/Admin)
exports.createOrder = async (req, res) => {
    try {
        const { items, shipping, payment, financials, notes } = req.body;

        // 1. Stock Reservation & Validation
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) throw new Error(`Produit introuvable: ${item.name}`);
            
            if (product.stock.available < item.quantity) {
                throw new Error(`Rupture de stock pour ${product.name}. Disponible: ${product.stock.available}`);
            }

            // Reserve Stock
            product.stock.reserved += item.quantity;
            product.stock.available = product.stock.total - product.stock.reserved;
            await product.save();
        }

        // 2. Generate Order Number (Industrial Format)
        const orderCount = await Order.countDocuments() + 1;
        const year = new Date().getFullYear();
        const orderNumber = `ORD-${year}-${String(orderCount).padStart(4, '0')}`;

        // 3. Estimate Delivery (Processing: 2 days + Method: 3 days)
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

        const order = new Order({
            orderNumber,
            artisan: req.user.id,
            items,
            shipping: { ...shipping, estimatedDelivery },
            payment,
            financials,
            notes,
            status: 'pending'
        });

        await order.save();
        res.status(201).json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get my orders with filters
// @route   GET /api/orders/my
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const { status, timeframe } = req.query;
        let query = { artisan: req.user.id };

        if (status && status !== 'all') query.status = status;
        
        if (timeframe === 'last_7') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            query.createdAt = { $gte: d };
        }

        const orders = await Order.find(query)
            .populate('items.product', 'name images')
            .sort('-createdAt');

        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update order status with timeline & stock release
// @route   PATCH /api/orders/:id/status
// @access  Private (Manufacturer/Admin)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;
        const order = await Order.findById(req.params.id);
        
        if (!order) return res.status(404).json({ success: false, message: 'Source introuvable.' });

        // Logic for stock release on cancellation or fulfillment
        if (status === 'cancelled' && order.status !== 'cancelled') {
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock.reserved -= item.quantity;
                    // Note: In some systems, we only release if not yet shipped. 
                    // But here it returns to available.
                    await product.save();
                }
            }
        }
        
        if (status === 'processing' && order.status === 'confirmed') {
             // Permanent reduction upon fulfillment
             for (const item of order.items) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock.reserved -= item.quantity;
                    product.stock.total -= item.quantity;
                    await product.save();
                }
            }
        }

        order.status = status;
        order.statusTimeline.push({
            status,
            comment: comment || `Mise à jour du protocole par l'opérateur.`,
            timestamp: new Date(),
            user: req.user.id
        });

        await order.save();
        res.status(200).json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get orders received by manufacturer
// @route   GET /api/orders/manufacturer
// @access  Private (Manufacturer)
exports.getManufacturerOrders = async (req, res) => {
    try {
        // Find orders containing products from this manufacturer
        // Note: In this schema, we might need to filter items in the application layer 
        // OR use aggregation to only return orders relevant to the manufacturer.
        const orders = await Order.find({
            'items.product': { $in: await Product.find({ manufacturer: req.user.id }).distinct('_id') }
        })
        .populate('artisan', 'companyName')
        .populate('items.product', 'name images manufacturer')
        .sort('-createdAt');

        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get order summary (analytics)
// @route   GET /api/orders/summary
// @access  Private
exports.getOrderAnalytics = async (req, res) => {
    try {
        const stats = await Order.aggregate([
            { $match: { artisan: req.user.id } },
            { $group: {
                _id: null,
                totalSpent: { $sum: '$financials.total' },
                avgOrderValue: { $avg: '$financials.total' },
                count: { $sum: 1 }
            }}
        ]);

        const categories = await Order.aggregate([
            { $match: { artisan: req.user.id } },
            { $unwind: '$items' },
            { $group: {
                _id: '$items.name',
                count: { $sum: '$items.quantity' },
                revenue: { $sum: '$items.total' }
            }},
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({ success: true, data: { stats: stats[0] || {}, popularItems: categories } });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
