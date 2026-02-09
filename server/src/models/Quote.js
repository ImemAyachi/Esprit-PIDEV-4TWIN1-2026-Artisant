const mongoose = require('mongoose');

const quoteItemSchema = new mongoose.Schema({
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number,
});

const quoteSchema = new mongoose.Schema({
    quoteNumber: {
        type: String,
        required: true,
        unique: true,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    artisan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    clientName: {
        type: String,
        required: true,
    },
    clientEmail: String,
    items: [quoteItemSchema],
    subtotal: Number,
    tax: Number,
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Converted to Invoice'],
        default: 'Draft',
    },
    validUntil: Date,
}, {
    timestamps: true,
});

const Quote = mongoose.model('Quote', quoteSchema);
module.exports = Quote;
