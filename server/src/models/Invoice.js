const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number,
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
    },
    quote: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quote',
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
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
    items: [invoiceItemSchema],
    totalAmount: Number,
    paidAmount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Canceled'],
        default: 'Unpaid',
    },
    dueDate: Date,
}, {
    timestamps: true,
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;
