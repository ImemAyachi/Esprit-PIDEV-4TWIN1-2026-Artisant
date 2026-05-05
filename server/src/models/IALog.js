import mongoose from 'mongoose';

const iaLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    serviceType: {
        type: String,
        enum: ['vocal', 'reconnaissance_faciale', 'generation_texte', 'prediction'],
        required: true,
    },
    inputData: {
        type: String, // Stringified JSON or text
    },
    outputData: {
        type: String,
    },
    responseTime: {
        type: Number, // milliseconds
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: false,
});

const IALog = mongoose.model('IALogYahya', iaLogSchema);
export default IALog;
