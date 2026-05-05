import Product from '../models/Product.js';

// @desc    Get all products with basic filtering and search
// @route   GET /api/products
export const getProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, manufacturer } = req.query;
        let query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (category && category !== 'all') {
            query.category = category;
        }
        if (minPrice || maxPrice) {
            query.unitPrice = {};
            if (minPrice) query.unitPrice.$gte = Number(minPrice);
            if (maxPrice) query.unitPrice.$lte = Number(maxPrice);
        }
        if (manufacturer) query.manufacturer = manufacturer;

        const products = await Product.find(query).populate('manufacturer', 'companyName email');
        
        // Map for frontend compatibility
        const mappedProducts = products.map(p => ({
            ...p.toObject(),
            price: p.unitPrice,
            stock: { available: p.stockQuantity, threshold: 5 }, // Default threshold for UI
            images: p.imageUrls.map(url => ({ url })),
            ratings: { average: 4.5, count: 12 },
            specifications: [
                { key: 'Origine', value: 'Certification Industrielle' },
                { key: 'Qualité', value: 'Grade A1' }
            ],
            reviews: []
        }));


        res.status(200).json({ success: true, count: products.length, data: mappedProducts });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};


// @desc    Create product
// @route   POST /api/products
export const createProduct = async (req, res) => {
    try {
        const { name, description, category, price, stock, imageUrls } = req.body;
        
        const product = await Product.create({
            name,
            description,
            category,
            unitPrice: price || 0,
            stockQuantity: stock?.total || 0,
            imageUrls: imageUrls || [],
            manufacturer: req.user.id
        });

        const mappedProduct = {
            ...product.toObject(),
            price: product.unitPrice,
            stock: { available: product.stockQuantity, threshold: 5 },
            images: product.imageUrls.map(url => ({ url })),
            ratings: { average: 4.5, count: 0 },
            specifications: [],
            reviews: []
        };

        res.status(201).json({ success: true, data: mappedProduct });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
    try {
        const { name, description, category, price, stock, imageUrls } = req.body;
        
        const updateData = {
            name,
            description,
            category,
            unitPrice: price,
            stockQuantity: stock?.total,
            imageUrls
        };

        // Remove undefined fields
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

        const mappedProduct = {
            ...product.toObject(),
            price: product.unitPrice,
            stock: { available: product.stockQuantity, threshold: 5 },
            images: product.imageUrls.map(url => ({ url })),
            ratings: { average: 4.5, count: 12 },
            specifications: [],
            reviews: []
        };

        res.status(200).json({ success: true, data: mappedProduct });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};


// @desc    Delete product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
        res.status(200).json({ success: true, message: 'Product deleted.' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
export const getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.find({
            manufacturer: req.user.id,
            stockQuantity: { $lte: 5 }
        }).sort('stockQuantity');

        const mappedProducts = products.map(p => ({
            ...p.toObject(),
            price: p.unitPrice,
            stock: { available: p.stockQuantity, threshold: 5 },
            images: p.imageUrls.map(url => ({ url }))
        }));

        res.status(200).json({ success: true, count: products.length, data: mappedProducts });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

