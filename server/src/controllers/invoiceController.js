const Invoice = require('../models/Invoice');
const Quote = require('../models/Quote');

// @desc    Convert quote to invoice
// @route   POST /api/invoices/convert/:quoteId
// @access  Private (Artisan)
exports.convertToInvoice = async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.quoteId);

        if (!quote) {
            return res.status(404).json({ success: false, message: 'Quote not found' });
        }

        if (quote.artisan.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Check if already converted
        if (quote.status === 'Converted to Invoice') {
            return res.status(400).json({ success: false, message: 'Quote already converted to invoice' });
        }

        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}`;

        // Create invoice from quote data
        const invoice = await Invoice.create({
            invoiceNumber,
            quote: quote._id,
            project: quote.project,
            artisan: quote.artisan,
            clientName: quote.clientName,
            items: quote.items,
            totalAmount: quote.totalAmount,
            status: 'Unpaid',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
        });

        // Update quote status
        quote.status = 'Converted to Invoice';
        await quote.save();

        res.status(201).json({
            success: true,
            data: invoice
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// @desc    Get all invoices for logged in artisan
// @route   GET /api/invoices/my
// @access  Private (Artisan)
exports.getMyInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ artisan: req.user.id })
            .populate('project', 'title')
            .populate('quote', 'quoteNumber')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: invoices.length,
            data: invoices
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// @desc    Get dashboard invoice summary (Zahra's task - IA summary)
// @route   GET /api/invoices/summary
// @access  Private (Artisan)
exports.getInvoiceSummary = async (req, res) => {
    try {
        const invoices = await Invoice.find({ artisan: req.user.id });

        const totalRevenue = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
        const paidAmount = invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((acc, inv) => acc + inv.totalAmount, 0);
        const pendingAmount = totalRevenue - paidAmount;

        res.status(200).json({
            success: true,
            data: {
                count: invoices.length,
                totalRevenue,
                paidAmount,
                pendingAmount,
                recentInvoices: invoices.slice(0, 5)
            }
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};
