const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
    quoteNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    client: {
        name: { type: String, required: true },
        email: { type: String },
        address: { type: String },
        phone: { type: String }
    },
    artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        discount: {
            type: { type: String, enum: ['percentage', 'amount'], default: 'percentage' },
            value: { type: Number, default: 0 }
        },
        taxRate: { type: Number, default: 19 }, // Default VAT
        total: { type: Number }
    }],
    financials: {
        subtotal: { type: Number, default: 0 },
        totalDiscount: { type: Number, default: 0 },
        taxBreakdown: [{
            type: { type: String },
            rate: { type: Number },
            amount: { type: Number }
        }],
        shipping: { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'accepted', 'expired', 'rejected', 'converted'],
        default: 'draft'
    },
    validityPeriod: { type: Number, default: 30 }, // Days
    validUntil: { type: Date },
    termsAndConditions: { type: String },
    notes: { type: String },
    signature: {
        data: { type: String }, // Base64 signature
        signedAt: { type: Date },
        ipAddress: { type: String }
    },
    version: { type: Number, default: 1 },
    parentQuote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' }, // For versioning/reactivation
    history: [{
        action: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        details: String
    }],
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-calculate totals before saving
quoteSchema.pre('save', function(next) {
    let subtotal = 0;
    this.items.forEach(item => {
        let lineTotal = item.unitPrice * item.quantity;
        if (item.discount.type === 'percentage') {
            lineTotal -= lineTotal * (item.discount.value / 100);
        } else {
            lineTotal -= item.discount.value;
        }
        item.total = lineTotal;
        subtotal += lineTotal;
    });

    this.financials.subtotal = subtotal;
    // Simple global tax calculation for now, could be expanded
    const taxAmount = subtotal * (19 / 100); 
    this.financials.grandTotal = subtotal + taxAmount + (this.financials.shipping || 0);

    // Set validity date
    if (!this.validUntil) {
        this.validUntil = new Date(Date.now() + this.validityPeriod * 24 * 60 * 60 * 1000);
    }

    next();
});

module.exports = mongoose.model('Quote', quoteSchema);
