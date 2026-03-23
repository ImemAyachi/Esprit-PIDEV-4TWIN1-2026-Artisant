const Quote = require('../models/Quote');

// @desc    Create new quote
// @route   POST /api/quotes
exports.createQuote = async (req, res) => {
    try {
        const quote = await Quote.create({
            ...req.body,
            artisan: req.user.id
        });
        res.status(201).json({ success: true, data: quote });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all quotes for the logged-in artisan
// @route   GET /api/quotes/my
exports.getMyQuotes = async (req, res) => {
    try {
        const quotes = await Quote.find({ artisan: req.user.id }).populate('project').sort('-createdAt');
        
        const mappedQuotes = quotes.map(q => ({
            ...q.toObject(),
            title: q.project?.title || 'Sans titre',
            quoteNumber: `QT-${q._id.toString().slice(-6).toUpperCase()}`,
            client: { name: q.clientName },
            financials: { grandTotal: q.totalAmount },
            validUntil: new Date(q.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
            status: q.status === 'accepté' ? 'accepted' : 
                    q.status === 'envoyé' ? 'sent' : 
                    q.status === 'refusé' ? 'expired' : 'draft'
        }));

        res.status(200).json({ success: true, count: quotes.length, data: mappedQuotes });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update a quote
// @route   PUT /api/quotes/:id
exports.updateQuote = async (req, res) => {
    try {
        const quote = await Quote.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });

        const mappedQuote = {
            ...quote.toObject(),
            status: quote.status === 'accepté' ? 'accepted' : 
                    quote.status === 'envoyé' ? 'sent' : 
                    quote.status === 'refusé' ? 'expired' : 'draft'
        };

        res.status(200).json({ success: true, data: mappedQuote });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};


// @desc    Delete quote
// @route   DELETE /api/quotes/:id
exports.deleteQuote = async (req, res) => {
    try {
        const quote = await Quote.findByIdAndDelete(req.params.id);
        if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });
        res.status(200).json({ success: true, message: 'Quote deleted.' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Accept quote
// @route   PATCH /api/quotes/:id/accept
exports.acceptQuote = async (req, res) => {
    try {
        const quote = await Quote.findByIdAndUpdate(req.params.id, { status: 'accepté' }, { new: true });
        if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });
        res.status(200).json({ success: true, data: quote, message: 'Quote accepted.' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

