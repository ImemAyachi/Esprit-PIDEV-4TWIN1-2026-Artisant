import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    manufacturer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    stockQuantity: {
        type: Number,
        default: 0,
    },
    imageUrls: {
        type: [String],
        default: [],
    },
    predictedRuptureDate: {
        type: Date,
    },
}, {
    timestamps: true,
});

const Product = mongoose.model('ProductYahya', productSchema);
export default Product;

