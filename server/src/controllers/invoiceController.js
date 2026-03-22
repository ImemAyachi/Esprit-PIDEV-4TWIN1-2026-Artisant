const Invoice = require('../models/Invoice');
const Quote = require('../models/Quote');

// Generate sequential invoice number INV-YYYY-XXXX
const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const count = await Invoice.countDocuments({ invoiceNumber: new RegExp(`INV-${year}-`) });
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Create manual invoice
// @route   POST /api/invoices
// @access  Private (Artisan)
exports.createInvoice = async (req, res) => {
    try {
        const invoiceNumber = await generateInvoiceNumber();
        const invoice = new Invoice({
            ...req.body,
            invoiceNumber,
            artisan: req.user.id,
            history: [{
                action: 'created_manually',
                user: req.user.id,
                details: 'Emission manuelle hors protocole de devis.'
            }]
        });

        await invoice.save();

        res.status(201).json({ success: true, data: invoice });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all invoices with filters
// @route   GET /api/invoices/my
// @access  Private (Artisan)
exports.getMyInvoices = async (req, res) => {
    try {
        const { status, client, startDate, endDate, minAmount, maxAmount } = req.query;
        let query = { artisan: req.user.id, isDeleted: false };

        if (status && status !== 'all') query.status = status;
        if (client) query['client.name'] = new RegExp(client, 'i');
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const invoices = await Invoice.find(query).sort('-createdAt');
        res.status(200).json({ success: true, count: invoices.length, data: invoices });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// @desc    Record payment
// @route   PATCH /api/invoices/:id/payment
// @access  Private (Artisan)
exports.recordPayment = async (req, res) => {
    try {
        const { amount, method, reference, notes, date } = req.body;
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, message: 'Source de facturation introuvable.' });

        // Add payment to history
        invoice.payment.history.push({
            amount: Number(amount),
            method,
            reference,
            notes,
            date: date || new Date()
        });

        invoice.history.push({
            action: 'payment_recorded',
            user: req.user.id,
            details: `Paiement de ${amount} DT enregistré via ${method}.`
        });

        // Balance and status update handled by pre-save hook in model
        await invoice.save();

        res.status(200).json({ success: true, data: invoice, message: 'Transaction opérationnelle scellée.' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Void invoice
// @route   PATCH /api/invoices/:id/void
// @access  Private (Admin/Artisan with high approval)
exports.voidInvoice = async (req, res) => {
    try {
        const { reason } = req.body;
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, message: 'Facture inexistante.' });

        if (invoice.payment.history.length > 0 && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Approbation administrative requise : paiement déjà perçu.' });
        }

        invoice.status = 'void';
        invoice.voidReason = reason;
        invoice.history.push({
            action: 'voided',
            user: req.user.id,
            details: `Facture annulée. Raison : ${reason}`
        });

        await invoice.save();

        res.status(200).json({ success: true, data: invoice });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Check overdue status (System routine)
// @route   GET /api/invoices/check-overdue
// @access  Private (System/Admin)
exports.checkOverdue = async (req, res) => {
    try {
        const today = new Date();
        const invoices = await Invoice.find({ 
            status: { $in: ['sent', 'draft'] }, 
            'payment.dueDate': { $lt: today },
            'financials.balance': { $gt: 0 }
        });

        let updatedCount = 0;
        for (let invoice of invoices) {
            invoice.status = 'overdue';
            invoice.history.push({ action: 'status_auto_overdue', details: `Facture passée en impayée (échéance au ${invoice.payment.dueDate.toLocaleDateString()}).` });
            await invoice.save();
            updatedCount++;
        }

        res.status(200).json({ success: true, count: updatedCount, message: `${updatedCount} protocoles mis à jour.` });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get Financial Summary
// @route   GET /api/invoices/summary
// @access  Private (Artisan)
exports.getFinancialSummary = async (req, res) => {
    try {
        const invoices = await Invoice.find({ artisan: req.user.id, status: { $ne: 'void' } });
        const quotes = await Quote.find({ artisan: req.user.id, isDeleted: false });

        const summary = {
            totalQuotes: quotes.reduce((acc, q) => acc + q.financials.grandTotal, 0),
            totalInvoiced: invoices.reduce((acc, i) => acc + i.financials.grandTotal, 0),
            totalPaid: invoices.reduce((acc, i) => {
                return acc + i.payment.history.reduce((a, p) => a + p.amount, 0);
            }, 0),
            totalOutstanding: invoices.reduce((acc, i) => acc + i.financials.balance, 0),
            aging: {
                current: 0,
                '1-30': 0,
                '31-60': 0,
                '61-90': 0,
                '90+': 0
            }
        };

        const today = new Date();
        invoices.filter(i => i.financials.balance > 0).forEach(i => {
            const diffDays = Math.ceil((today - i.payment.dueDate) / (1000 * 60 * 60 * 24));
            if (diffDays <= 0) summary.aging.current += i.financials.balance;
            else if (diffDays <= 30) summary.aging['1-30'] += i.financials.balance;
            else if (diffDays <= 60) summary.aging['31-60'] += i.financials.balance;
            else if (diffDays <= 90) summary.aging['61-90'] += i.financials.balance;
            else summary.aging['90+'] += i.financials.balance;
        });

        res.status(200).json({ success: true, data: summary });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
