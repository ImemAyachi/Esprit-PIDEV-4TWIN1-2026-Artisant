const Product = require('../models/Product');

// @desc    Get all products (with search, filter, pagination)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, manufacturer, page = 1, limit = 12 } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
            ];
        }

        if (category) query.category = { $regex: category, $options: 'i' };
        if (manufacturer) query.manufacturer = manufacturer;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('manufacturer', 'companyName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({
            success: true,
            data: products,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('manufacturer', 'companyName email');
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  manufacturer / admin
const createProduct = async (req, res) => {
    try {
        const product = await Product.create({ ...req.body, manufacturer: req.user.id });
        res.status(201).json({ success: true, data: product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  manufacturer (owner) / admin
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        if (req.user.role !== 'admin' && String(product.manufacturer) !== String(req.user._id || req.user.id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  manufacturer (owner) / admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        // Ownership check
        if (req.user.role !== 'admin' && String(product.manufacturer) !== String(req.user._id || req.user.id)) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Generate AI description for a product
// @route   POST /api/products/ai-description
// @access  manufacturer / admin
const generateAIDescription = async (req, res) => {
    try {
        const { name, category, specifications } = req.body;

        // AI mock — replace with a real LLM call if an API key is available
        const specsText = (specifications || [])
            .map((s) => `${s.key}: ${s.value}`)
            .join(', ');

        const description = `${name} est un produit de qualité supérieure dans la catégorie ${category}. `
            + (specsText ? `Caractéristiques techniques : ${specsText}. ` : '')
            + `Fabriqué avec soin par des artisans experts, ce produit allie durabilité et esthétique pour satisfaire les exigences les plus élevées.`;

        res.json({ success: true, description });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    generateAIDescription,
};
