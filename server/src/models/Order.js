const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true },
    artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true }
    }],
    shipping: {
        address: { type: String, required: true },
        city: { type: String },
        country: { type: String, default: 'Tunisia' },
        phone: { type: String },
        method: { type: String, default: 'Standard' },
        estimatedDelivery: { type: Date }
    },
    payment: {
        method: { type: String, enum: ['bank_transfer', 'check', 'cash', 'credit_card'], required: true },
        status: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
        transactionId: { type: String }
    },
    financials: {
        subtotal: { type: Number, required: true },
        tax: { type: Number, default: 0 },
        shippingCost: { type: Number, default: 0 },
        total: { type: Number, required: true }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    statusTimeline: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        comment: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    notes: { type: String },
    cancellationReason: { type: String },
    refundAmount: { type: Number, default: 0 }
}, { timestamps: true });

// Pre-save to calculate totals if not provided
orderSchema.pre('save', async function() {
    if (this.isNew) {
        this.statusTimeline.push({
            status: 'pending',
            comment: 'Protocole de commande initialisé par l\'agent.',
            timestamp: new Date(),
            user: this.artisan
        });
    }
});

module.exports = mongoose.model('Order', orderSchema);
