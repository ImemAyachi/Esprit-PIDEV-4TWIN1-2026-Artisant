const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');

// Helper to map order for frontend
const mapOrder = (order, artisan) => ({
    ...order.toObject(),
    orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
    financials: { total: order.totalPrice },
    status: order.status === 'en_attente' ? 'pending' : 
            order.status === 'expédié' ? 'shipped' : 
            order.status === 'livré' ? 'delivered' : 
            order.status === 'annulé' ? 'cancelled' : order.status,
    shipping: { 
        address: order.shippingAddress, 
        contactName: artisan?.companyName || 'Artisant Expert' 
    }
});

// @desc    Create new order
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
    try {
        const { items, shipping, financials, vocalResumeUrl } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Le panier est vide ou malformé.' });
        }

        // Manufacturer resolution and item verification
        const productIds = items.map(i => i.product);
        const products = await Product.find({ _id: { $in: productIds } });
        
        if (products.length === 0) {
            return res.status(400).json({ success: false, message: 'Aucun produit valide trouvé.' });
        }

        const firstProduct = products[0];
        const manufacturerId = firstProduct.manufacturer;

        // Calculate total if financials missing or for verification
        const calculatedTotal = items.reduce((sum, item) => {
            const p = products.find(prod => prod._id.toString() === item.product);
            return sum + (p?.unitPrice || 0) * item.quantity;
        }, 0);

        // Apply shipping cost logic (matching cartStore.js)
        const finalTotal = calculatedTotal + (calculatedTotal * 0.19) + (calculatedTotal > 500 ? 0 : 50);

        const timestamp = Date.now().toString().slice(-4);
        const randomStr = Math.random().toString(36).substring(2, 4).toUpperCase();
        const orderNumber = `ORD-${timestamp}-${randomStr}`;

        const order = await Order.create({
            artisan: req.user._id,
            manufacturer: manufacturerId,
            orderNumber: orderNumber,
            shippingAddress: shipping?.address || 'Adresse de livraison par défaut',
            totalPrice: financials?.total || finalTotal,
            vocalResumeUrl: vocalResumeUrl,
            status: 'en_attente'
        });


        // Create order items with reliable database prices
        for (const item of items) {
            const prod = products.find(p => p._id.toString() === item.product);
            await OrderItem.create({
                order: order._id,
                product: item.product,
                quantity: item.quantity,
                unitPrice: prod?.unitPrice || item.price || 0,
                subtotal: (prod?.unitPrice || item.price || 0) * item.quantity
            });
        }

        const mapped = mapOrder(order, req.user);
        res.status(201).json({ success: true, data: mapped });
    } catch (err) {
        console.error('CRITICAL Order Creation Failure:', err);
        res.status(400).json({ success: false, message: `System Error: ${err.message}` });
    }
};





// @desc    Get all orders for the logged-in artisan
// @route   GET /api/orders/my
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ artisan: req.user.id })
            .populate('manufacturer', 'companyName')
            .sort('-createdAt');
        
        const mappedOrders = [];
        for (const order of orders) {
            const items = await OrderItem.find({ order: order._id }).populate('product');
            const mapped = mapOrder(order, req.user);
            mappedOrders.push({
                ...mapped,
                items: items.map(i => ({
                    ...i.toObject(),
                    name: i.product?.name || 'N/A',
                    total: i.quantity * i.unitPrice
                }))
            });
        }

        res.status(200).json({ success: true, count: orders.length, data: mappedOrders });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all orders for the logged-in manufacturer
// @route   GET /api/orders/manufacturer
exports.getManufacturerOrders = async (req, res) => {
    try {
        const orders = await Order.find({ manufacturer: req.user.id })
            .populate('artisan', 'companyName email')
            .sort('-createdAt');
        
        const mappedOrders = [];
        for (const order of orders) {
            const items = await OrderItem.find({ order: order._id }).populate('product');
            const mapped = mapOrder(order, order.artisan);
            mappedOrders.push({
                ...mapped,
                items: items.map(i => ({
                    ...i.toObject(),
                    name: i.product?.name || 'N/A',
                    total: i.quantity * i.unitPrice
                }))
            });
        }
        res.status(200).json({ success: true, count: orders.length, data: mappedOrders });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};


// @desc    Update order status
// @route   PATCH /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
        res.status(200).json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get order details (with items)
// @route   GET /api/orders/:id
exports.getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('artisan', 'companyName')
            .populate('manufacturer', 'companyName');
        
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        const items = await OrderItem.find({ order: order._id }).populate('product');

        res.status(200).json({ success: true, data: { order, items } });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get order analytics for dashboard
// @route   GET /api/orders/summary
exports.getOrderAnalytics = async (req, res) => {
    try {
        const query = req.user.role === 'manufacturer' 
            ? { manufacturer: req.user.id } 
            : { artisan: req.user.id };

        const orders = await Order.find(query);
        const totalSpent = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        
        const analytics = {
            totalOrders: orders.length,
            totalRevenue: totalSpent,
            stats: {
                totalSpent: totalSpent,
                avgOrderValue: orders.length > 0 ? totalSpent / orders.length : 0
            },
            statusDistribution: {
                pending: orders.filter(o => o.status === 'en_attente').length,
                shipped: orders.filter(o => o.status === 'expédié').length,
                delivered: orders.filter(o => o.status === 'livré').length,
                cancelled: orders.filter(o => o.status === 'annulé').length
            }
        };

        res.status(200).json({ success: true, data: analytics });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};


