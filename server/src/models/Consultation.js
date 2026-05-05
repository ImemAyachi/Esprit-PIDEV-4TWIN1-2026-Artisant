import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
    },
    action: {
        type: String,
        enum: ['view', 'download', 'print', 'favorite'],
        default: 'view',
    },
    timeSpent: {
        type: Number, // in seconds
        default: 0,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Consultation = mongoose.model('ConsultationYahya', consultationSchema);
export default Consultation;
