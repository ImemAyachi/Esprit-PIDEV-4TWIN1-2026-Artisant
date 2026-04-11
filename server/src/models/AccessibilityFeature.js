import mongoose from 'mongoose';

const accessibilityFeatureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    wcagLevel: {
        type: String,
        enum: ['A', 'AA', 'AAA'],
    },
    description: {
        type: String,
    },
    implementationCode: {
        type: String, // code snippet or implementation details
    },
}, {
    timestamps: true,
});

const AccessibilityFeature = mongoose.model('AccessibilityFeatureYahya', accessibilityFeatureSchema);
export default AccessibilityFeature;
