import mongoose from 'mongoose';

const accessibilityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    feature: {
        type: String, // feature name or ID
    },
    action: {
        type: String, // action taken
    },
    successRate: {
        type: Number, // float representing success rate
        default: 1.0,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: false,
});

const AccessibilityLog = mongoose.model('AccessibilityLogYahya', accessibilityLogSchema);
export default AccessibilityLog;
