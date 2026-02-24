const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
    },
    description: {
        type: String,
    },
    artisan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['planned', 'in_progress', 'completed', 'archived'],
        default: 'planned',
    },
    startDate: Date,
    endDate: Date,
    address: {
        type: String,
    },
}, {
    timestamps: true,
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
