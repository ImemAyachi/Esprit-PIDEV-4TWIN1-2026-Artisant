const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
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
        taxRate: { type: Number, default: 19 },
        total: { type: Number }
    }],
    financials: {
        subtotal: { type: Number, default: 0 },
        totalDiscount: { type: Number, default: 0 },
        taxAmount: { type: Number},
        shipping: { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 },
        balance: { type: Number, default: 0 }
    },
    payment: {
        method: { type: String, enum: ['bank_transfer', 'check', 'cash', 'credit_card', 'mobile_payment'] },
        terms: { type: String, enum: ['Net 15', 'Net 30', 'Net 60'], default: 'Net 30' },
        dueDate: { type: Date },
        history: [{
            amount: { type: Number, required: true },
            date: { type: Date, default: Date.now },
            method: { type: String },
            reference: { type: String },
            notes: { type: String }
        }]
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'void'],
        default: 'draft'
    },
    voidReason: { type: String },
    isApproved: { type: Boolean, default: false },
    notes: { type: String },
    history: [{
        action: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        details: String
    }],
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-calculate totals and balance
invoiceSchema.pre('save', async function() {
    let subtotal = 0;
    this.items.forEach(item => {
        let lineTotal = item.unitPrice * item.quantity;
        item.total = lineTotal;
        subtotal += lineTotal;
    });

    this.financials.subtotal = subtotal;
    const taxAmount = subtotal * (19 / 100); 
    this.financials.taxAmount = taxAmount;
    this.financials.grandTotal = subtotal + taxAmount + (this.financials.shipping || 0);

    const paidAmount = this.payment.history.reduce((acc, p) => acc + p.amount, 0);
    this.financials.balance = this.financials.grandTotal - paidAmount;

    if (this.financials.balance <= 0) {
        this.status = 'paid';
    } else if (this.payment.dueDate < new Date() && this.status !== 'cancelled' && this.status !== 'void') {
        this.status = 'overdue';
    }

    // Set default due date if not set
    if (!this.payment.dueDate) {
        const days = this.payment.terms === 'Net 15' ? 15 : this.payment.terms === 'Net 60' ? 60 : 30;
        this.payment.dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
