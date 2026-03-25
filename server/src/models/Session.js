const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    ip: {
        type: String,
        required: true,
    },
    userAgent: {
        type: String,
        required: true,
    },
    device: {
        type: String,
        default: 'Unknown Device',
    },
    location: {
        type: String,
        default: 'Unknown Location',
    },
    isCurrent: {
        type: Boolean,
        default: false,
    },
    lastActive: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
