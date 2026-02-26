const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    type: {
        type: String,
        enum: ['Technical Sheet', 'Manual', 'Catalog', 'Legal'],
        required: true,
    },
    url: {
        type: String,
        required: [true, 'Please provide a document URL'],
    },
    category: {
        type: String,
        required: true,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isAccessible: {
        type: Boolean,
        default: true,
    },
    aiSummary: {
        type: String, // Simplified explanation
    }
}, {
    timestamps: true,
});

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
