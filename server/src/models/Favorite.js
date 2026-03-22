const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
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
    folder: {
        type: String,
        default: 'General'
    },
    note: {
        type: String,
        trim: true,
    },
    sharedWith: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        permission: { type: String, enum: ['view', 'edit'], default: 'view' }
    }]
}, {
    timestamps: true,
});

// For collaborative filtering later
favoriteSchema.index({ user: 1, type: 1, item: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);
module.exports = Favorite;
