const mongoose = require('mongoose');

const documentVersionSchema = new mongoose.Schema({
    version: { type: Number, required: true },
    url: String,
    size: Number,
    description: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now }
});

const sharingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['artisan', 'manufacturer', 'expert', 'admin'] },
    permissions: { type: String, enum: ['view', 'download', 'edit'], default: 'view' },
    password: { type: String }, // Hashed if possible
    expiresAt: Date
});

const downloadLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ip: String,
    purpose: String,
    timestamp: { type: Date, default: Date.now }
});

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
        enum: ['Technical Sheet', 'Manual', 'Catalog', 'Legal', 'Drawing', 'Specification'],
        required: true,
    },
    fileUrl: {
        type: String,
        required: [true, 'Please provide a document URL'],
    },
    folder: {
        name: { type: String, default: 'Root' },
        parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' } // Optional for hierarchical folders
    },
    tags: [String],
    category: {
        type: String,
        required: true,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    versions: [documentVersionSchema],
    sharing: [sharingSchema],
    downloadLog: [downloadLogSchema],
    isAccessible: {
        type: Boolean,
        default: true,
    },
    expiryDate: Date,
    isArchived: { type: Boolean, default: false },
    aiSummary: {
        type: String,
    }
}, {
    timestamps: true,
});

// Full-text index for titles and descriptions
documentSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
