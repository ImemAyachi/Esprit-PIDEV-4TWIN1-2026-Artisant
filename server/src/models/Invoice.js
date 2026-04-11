import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    quote: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quote',
        required: true,
    },
    artisan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
    },
    amountPaid: {
        type: Number,
        default: 0,
    },
    issueDate: {
        type: Date,
        default: Date.now,
    },
    dueDate: {
        type: Date,
    },
    paymentMode: {
        type: String,
    },
    vocalResumeUrl: {
        type: String,
    },
    status: {
        type: String,
        enum: ['en_attente', 'payé', 'en_retard'],
        default: 'en_attente',
    },
}, {
    timestamps: true,
});

const Invoice = mongoose.model('InvoiceYahya', invoiceSchema);
export default Invoice;

