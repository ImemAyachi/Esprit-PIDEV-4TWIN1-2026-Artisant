import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    artisan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    manufacturer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true,
    },
    shippingAddress: {
        type: String,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['en_attente', 'confirmée', 'expédiée', 'livrée'],
        default: 'en_attente',
    },

    orderDate: {
        type: Date,
        default: Date.now,
    },
    vocalResumeUrl: {
        type: String,
    },
}, {
    timestamps: true,
});

const Order = mongoose.model('OrderYahya', orderSchema);
export default Order;

