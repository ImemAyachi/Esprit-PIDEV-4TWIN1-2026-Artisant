import mongoose from 'mongoose';

const expertSavedDocumentSchema = new mongoose.Schema({
    expert: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
    },
    notes: {
        type: String,
    },
    savedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const ExpertSavedDocument = mongoose.model('ExpertSavedDocumentYahya', expertSavedDocumentSchema);
export default ExpertSavedDocument;
