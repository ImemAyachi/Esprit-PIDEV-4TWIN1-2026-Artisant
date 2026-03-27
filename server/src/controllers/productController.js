const Product = require('../models/Product');

// ─── Get all products ───────────────────────────────────────────────────────
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('manufacturer', 'companyName');
        res.status(200).json({
            success: true,
            data: products,
            pagination: { total: products.length },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Get product by ID ──────────────────────────────────────────────────────
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('manufacturer', 'companyName');
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.status(200).json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Create a new product ───────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
    try {
        const productData = { ...req.body, manufacturer: req.user._id };
        const product = await Product.create(productData);
        res.status(201).json({ success: true, data: product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─── Update an existing product ─────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.status(200).json({ success: true, data: product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─── Delete a product ───────────────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Generate AI description ────────────────────────────────────────────────
exports.generateAIDescription = async (req, res) => {
    try {
        // Mock generation for now
        res.status(200).json({ description: "This is a highly innovative product designed to seamlessly integrate into industrial workflows." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
