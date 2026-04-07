import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
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
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['brouillon', 'envoyé', 'accepté', 'refusé'],
        default: 'brouillon',
    },
    pdfUrl: {
        type: String,
    },
    accessiblePdfUrl: {
        type: String,
    },
    isAiGenerated: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const Quote = mongoose.model('QuoteYahya', quoteSchema);
export default Quote;

