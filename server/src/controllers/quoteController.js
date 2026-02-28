const Quote = require('../models/Quote');
const Project = require('../models/Project');

// @desc    Create new quote
// @route   POST /api/quotes
// @access  Private (Artisan)
exports.createQuote = async (req, res) => {
    try {
        const { project, clientName, clientEmail, items, tax, validUntil } = req.body;

        // Calculate totals
        let subtotal = 0;
        const processedItems = items.map(item => {
            const itemTotal = item.quantity * item.unitPrice;
            subtotal += itemTotal;
            return {
                ...item,
                total: itemTotal
            };
        });

        const totalAmount = subtotal + (tax || 0);

        // Simple quote number generation: Q-TIMESTAMP
        const quoteNumber = `Q-${Date.now()}`;

        const quote = await Quote.create({
            quoteNumber,
            project,
            artisan: req.user.id,
            clientName,
            clientEmail,
            items: processedItems,
            subtotal,
            tax,
            totalAmount,
            validUntil
        });

        res.status(201).json({
            success: true,
            data: quote
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// @desc    Get all quotes for logged in artisan
// @route   GET /api/quotes/my
// @access  Private (Artisan)
exports.getMyQuotes = async (req, res) => {
    try {
        const quotes = await Quote.find({ artisan: req.user.id })
            .populate('project', 'title')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: quotes.length,
            data: quotes
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// @desc    Update a quote
// @route   PUT /api/quotes/:id
// @access  Private (Artisan)
exports.updateQuote = async (req, res) => {
    try {
        let quote = await Quote.findById(req.params.id);

        if (!quote) {
            return res.status(404).json({ success: false, message: 'Quote not found' });
        }

        if (quote.artisan.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { items, tax } = req.body;

        if (items) {
            let subtotal = 0;
            req.body.items = items.map(item => {
                const itemTotal = item.quantity * item.unitPrice;
                subtotal += itemTotal;
                return { ...item, total: itemTotal };
            });
            req.body.subtotal = subtotal;
            req.body.totalAmount = subtotal + (tax || quote.tax || 0);
        }

        quote = await Quote.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: quote
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// @desc    Delete a quote
// @route   DELETE /api/quotes/:id
// @access  Private (Artisan)
exports.deleteQuote = async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id);

        if (!quote) {
            return res.status(404).json({ success: false, message: 'Quote not found' });
        }

        if (quote.artisan.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await quote.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};
