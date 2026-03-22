const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['view', 'download', 'print', 'favorite', 'quote', 'compare'],
        required: true,
    },
    timestamp: { type: Date, default: Date.now },
    meta: mongoose.Schema.Types.Mixed // For extra context like "section viewed"
});

const consultationHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['Product', 'Document'],
        required: true,
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'type'
    },
    timeSpent: {
        type: Number, // Seconds
        default: 0,
    },
    sectionsViewed: [String], // Keys of sections like "dimensions", "materials"
    interactions: [interactionSchema],
    notes: String,
    lastViewed: { type: Date, default: Date.now }
}, {
    timestamps: true,
});

// For analytics and history filtering
consultationHistorySchema.index({ user: 1, lastViewed: -1 });

const ConsultationHistory = mongoose.model('ConsultationHistory', consultationHistorySchema);
module.exports = ConsultationHistory;
