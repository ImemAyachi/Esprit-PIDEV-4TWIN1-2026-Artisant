const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    subCategory: { type: String },
    images: [{
        url: { type: String, required: true },
        alt: { type: String }
    }],
    stock: {
        total: { type: Number, default: 0 },
        reserved: { type: Number, default: 0 },
        available: { type: Number, default: 0 },
        threshold: { type: Number, default: 5 }
    },
    specifications: [{
        key: String,
        value: String
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'coming_soon'],
        default: 'active'
    },
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
    history: [{
        action: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        details: String
    }],
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Full-text search index
productSchema.index({ name: 'text', description: 'text', category: 'text' });

// Pre-save to calculate available stock
productSchema.pre('save', function(next) {
    this.stock.available = this.stock.total - this.stock.reserved;
    next();
});

module.exports = mongoose.model('Product', productSchema);
