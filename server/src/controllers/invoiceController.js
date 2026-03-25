const Invoice = require('../models/Invoice');

// @desc    Create new invoice
// @route   POST /api/invoices
exports.createInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.create({
            ...req.body,
            artisan: req.user.id
        });
        res.status(201).json({ success: true, data: invoice });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all invoices for the logged-in artisan
// @route   GET /api/invoices/my
exports.getMyInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ artisan: req.user.id })
            .populate('quote', 'clientName totalAmount')
            .sort('-createdAt');

        const mappedInvoices = invoices.map(inv => ({
            ...inv.toObject(),
            client: { name: inv.quote?.clientName || 'N/A' },
            financials: { grandTotal: inv.quote?.totalAmount || 0 },
            payment: { dueDate: inv.dueDate },
            status: inv.status === 'payé' ? 'paid' : inv.status === 'en_retard' ? 'overdue' : 'pending'
        }));

        res.status(200).json({ success: true, count: invoices.length, data: mappedInvoices });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update an invoice
// @route   PUT /api/invoices/:id
exports.updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
        res.status(200).json({ success: true, data: invoice });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
        res.status(200).json({ success: true, message: 'Invoice deleted.' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
// @desc    Get financial summary
// @route   GET /api/invoices/summary
exports.getFinancialSummary = async (req, res) => {
    try {
        const invoices = await Invoice.find({ artisan: req.user.id }).populate('quote', 'totalAmount');
        const summary = {
            totalInvoiced: invoices.reduce((acc, i) => acc + (i.quote?.totalAmount || 0), 0),
            totalPaid: invoices.reduce((acc, i) => i.status === 'payé' ? acc + (i.quote?.totalAmount || 0) : acc, 0),
            totalOutstanding: invoices.reduce((acc, i) => (i.status === 'en_attente' || i.status === 'en_retard') ? acc + (i.quote?.totalAmount || 0) : acc, 0),
            totalQuotes: invoices.length,
            aging: {
                current: invoices.filter(i => i.status === 'en_attente').reduce((acc, i) => acc + (i.quote?.totalAmount || 0), 0),
                '30-60': 0,
                '60-90': 0,
                '90+': invoices.filter(i => i.status === 'en_retard').reduce((acc, i) => acc + (i.quote?.totalAmount || 0), 0)
            }
        };
        res.status(200).json({ success: true, data: summary });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Record payment
// @route   PATCH /api/invoices/:id/payment
exports.recordPayment = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, { 
            status: 'payé',
            amountPaid: req.body.amount || 0 
        }, { new: true });
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
        res.status(200).json({ success: true, data: invoice });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Void invoice
// @route   PATCH /api/invoices/:id/void
exports.voidInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status: 'en_retard' }, { new: true });
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
        res.status(200).json({ success: true, data: invoice });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
