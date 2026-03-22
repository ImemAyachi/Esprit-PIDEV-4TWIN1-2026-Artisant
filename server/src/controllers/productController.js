const Product = require('../models/Product');

// @desc    Get all products with advanced filtering and search
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, status, manufacturer, sort } = req.query;
        let query = { isDeleted: false };

        if (search) {
            query.$text = { $search: search };
        }
        if (category && category !== 'all') {
            query.category = category;
        }
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        if (status) query.status = status;
        if (manufacturer) query.manufacturer = manufacturer;

        // Sorting
        let sortBy = '-createdAt';
        if (sort === 'price_asc') sortBy = 'price';
        if (sort === 'price_desc') sortBy = '-price';
        if (sort === 'popular') sortBy = '-ratings.average';

        const products = await Product.find(query)
            .populate('manufacturer', 'companyName')
            .sort(sortBy);

        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create product with history
// @route   POST /api/products
// @access  Private (Manufacturer/Admin)
exports.createProduct = async (req, res) => {
    try {
        const product = new Product({
            ...req.body,
            manufacturer: req.user.id,
            history: [{
                action: 'created',
                user: req.user.id,
                details: 'Référencement initial du produit dans le catalogue.'
            }]
        });

        await product.save();
        res.status(201).json({ success: true, data: product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update product + stock history
// @route   PUT /api/products/:id
// @access  Private (Manufacturer)
exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Source introuvable.' });

        // Authorization check
        if (product.manufacturer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Accès non autorisé.' });
        }

        const updates = req.body;
        if (updates.stock?.total !== undefined) {
            const diff = updates.stock.total - product.stock.total;
            product.history.push({
                action: 'stock_adjusted',
                user: req.user.id,
                details: `Stock ajusté de ${diff > 0 ? '+' : ''}${diff} unités. Raison: Réassortiment.`
            });
        }

        product = await Product.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Bulk update products
// @route   PATCH /api/products/bulk
// @access  Private (Manufacturer/Admin)
exports.bulkUpdateProducts = async (req, res) => {
    try {
        const { ids, updates } = req.body;
        await Product.updateMany(
            { _id: { $in: ids }, manufacturer: req.user.id },
            { $set: updates }
        );
        res.status(200).json({ success: true, message: 'Protocoles de masse mis à jour.' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Add review to product
// @route   POST /api/products/:id/review
// @access  Private (Any authenticated user)
exports.addProductReview = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Produit non répertorié.' });

        const { rating, comment } = req.body;
        product.reviews.push({ user: req.user.id, rating: Number(rating), comment });
        
        // Update average rating
        const totalRating = product.reviews.reduce((acc, r) => acc + r.rating, 0);
        product.ratings.average = totalRating / product.reviews.length;
        product.ratings.count = product.reviews.length;

        await product.save();
        res.status(201).json({ success: true, data: product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get low stock alerts
// @route   GET /api/products/low-stock
// @access  Private (Manufacturer/Admin)
exports.getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.find({
            manufacturer: req.user.id,
            'stock.available': { $lte: 5 }, // Hardcoded threshold or use product threshold
            isDeleted: false
        }).sort('stock.available');

        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
