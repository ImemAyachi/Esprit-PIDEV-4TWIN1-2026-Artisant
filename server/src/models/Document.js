const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['fiche technique', 'certification', 'manuel', 'autre'],
        default: 'autre',
    },
    fileUrl: {
        type: String,
        required: true,
    },
    accessibleVersionUrl: {
        type: String,
    },
    aiSummary: {
        type: String,
    },
    favoritedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
}, {
    timestamps: true,
});

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;

