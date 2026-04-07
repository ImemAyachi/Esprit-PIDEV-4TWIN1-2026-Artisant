import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    artisan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
    },
    description: {
        type: String,
    },
    address: {
        type: String,
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    vocalResumeUrl: {
        type: String,
    },
    totalAmount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['planifié', 'en_cours', 'terminé', 'archivé'],
        default: 'planifié',
    },
}, {
    timestamps: true,
});

const Project = mongoose.model('ProjectYahya', projectSchema);
export default Project;

