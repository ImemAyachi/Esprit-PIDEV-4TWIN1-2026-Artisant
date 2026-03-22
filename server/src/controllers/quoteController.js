const Quote = require('../models/Quote');
const Invoice = require('../models/Invoice');
const Project = require('../models/Project');

// Generate sequential quote number Q-YYYY-XXXX
const generateQuoteNumber = async () => {
    const year = new Date().getFullYear();
    const count = await Quote.countDocuments({ quoteNumber: new RegExp(`Q-${year}-`) });
    return `Q-${year}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Create new quote
// @route   POST /api/quotes
// @access  Private (Artisan)
exports.createQuote = async (req, res) => {
    try {
        const quoteNumber = await generateQuoteNumber();
        const quote = new Quote({
            ...req.body,
            quoteNumber,
            artisan: req.user.id,
            history: [{
                action: 'created',
                user: req.user.id,
                details: 'Protocol initialisé et matricule généré.'
            }]
        });

        await quote.save();

        res.status(201).json({ success: true, data: quote });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all quotes with advanced filtering
// @route   GET /api/quotes/my
// @access  Private (Artisan)
exports.getMyQuotes = async (req, res) => {
    try {
        const { status, client, startDate, endDate, minAmount, maxAmount, deleted } = req.query;
        let query = { artisan: req.user.id, isDeleted: deleted === 'true' };

        if (status && status !== 'all') query.status = status;
        if (client) query['client.name'] = new RegExp(client, 'i');
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        if (minAmount || maxAmount) {
            query['financials.grandTotal'] = {};
            if (minAmount) query['financials.grandTotal'].$gte = Number(minAmount);
            if (maxAmount) query['financials.grandTotal'].$lte = Number(maxAmount);
        }

        const quotes = await Quote.find(query).sort('-createdAt');
        res.status(200).json({ success: true, count: quotes.length, data: quotes });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update / Version a quote
// @route   PUT /api/quotes/:id
// @access  Private (Artisan)
exports.updateQuote = async (req, res) => {
    try {
        let quote = await Quote.findById(req.params.id);
        if (!quote) return res.status(404).json({ success: false, message: 'Quote inaccessible.' });

        // If sent, create a new version instead of overwriting
        if (quote.status === 'sent') {
            const newQuoteData = {
                ...quote._doc,
                ...req.body,
                _id: undefined,
                version: quote.version + 1,
                parentQuote: quote._id,
                status: 'draft',
                history: [...quote.history, {
                    action: 'versioned',
                    user: req.user.id,
                    details: `Nouvelle version générée (v${quote.version + 1}) suite à révision.`
                }]
            };
            const newQuote = await Quote.create(newQuoteData);
            return res.status(201).json({ success: true, data: newQuote, message: 'Nouveau jeton généré.' });
        }

        // Normal update for drafts
        quote = await Quote.findByIdAndUpdate(req.params.id, {
            ...req.body,
            $push: { history: { action: 'updated', user: req.user.id, details: 'Modifications des spécifications financières.' } }
        }, { new: true, runValidators: true });

        res.status(200).json({ success: true, data: quote });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Accept quote and generate invoice
// @route   PATCH /api/quotes/:id/accept
// @access  Public (Client with Token) or Private (Artisan demo)
exports.acceptQuote = async (req, res) => {
    try {
        const { signatureData, termsAccepted } = req.body;
        if (!termsAccepted) return res.status(400).json({ success: false, message: 'Acceptation des termes requise.' });

        const quote = await Quote.findById(req.params.id);
        if (!quote || quote.status === 'expired') return res.status(404).json({ success: false, message: 'Devis expiré ou inexistant.' });

        quote.status = 'accepted';
        quote.signature = {
            data: signatureData,
            signedAt: new Date(),
            ipAddress: req.ip
        };
        quote.history.push({
            action: 'accepted',
            details: `Protocole accepté par le client. Signature scellée le ${new Date().toLocaleString()}.`
        });

        await quote.save();

        // Trigger automatic invoice generation
        const invoice = await Invoice.create({
            invoiceNumber: `INV-${new Date().getFullYear()}-${String(await Invoice.countDocuments() + 1).padStart(4, '0')}`,
            quote: quote._id,
            title: quote.title,
            client: quote.client,
            artisan: quote.artisan,
            items: quote.items,
            financials: {
                ...quote.financials,
                balance: quote.financials.grandTotal
            },
            status: 'sent',
            history: [{ action: 'generated_from_quote', details: `Facture émise automatiquement suite à l'acceptation du devis ${quote.quoteNumber}.` }]
        });

        res.status(200).json({ success: true, data: quote, invoice, message: 'Acceptation enregistrée et facture émise.' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Soft delete / Permanent delete
// @route   DELETE /api/quotes/:id
// @access  Private (Artisan/Admin)
exports.deleteQuote = async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id);
        if (!quote) return res.status(404).json({ success: false, message: 'Gisement de données non trouvé.' });

        if (quote.status === 'draft') {
            await quote.deleteOne();
            return res.status(200).json({ success: true, message: 'Effacement définitif effectué.' });
        }

        quote.isDeleted = true;
        quote.history.push({ action: 'deleted', user: req.user.id, details: 'Archivage opérationnel effectué.' });
        await quote.save();

        res.status(200).json({ success: true, message: 'Protocol archivé avec succès.' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Reactivate expired quote
// @route   PATCH /api/quotes/:id/reactivate
// @access  Private (Artisan)
exports.reactivateQuote = async (req, res) => {
    try {
        const oldQuote = await Quote.findById(req.params.id);
        if (!oldQuote) return res.status(404).json({ success: false, message: 'Source introuvable.' });

        const newQuote = await Quote.create({
            ...oldQuote._doc,
            _id: undefined,
            status: 'draft',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            version: 1,
            history: [{
                action: 'reactivated',
                user: req.user.id,
                details: `Réactivation du devis archivé/expiré ${oldQuote.quoteNumber}.`
            }]
        });

        res.status(201).json({ success: true, data: newQuote });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
