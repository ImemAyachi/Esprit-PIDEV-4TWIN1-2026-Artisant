const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Delayed'], default: 'Pending' },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    dueDate: Date,
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project.milestones' }],
    completedAt: Date
});

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Todo', 'InProgress', 'Done'], default: 'Todo' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    dueDate: Date,
    description: String
});

const teamMemberSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['Project Manager', 'Worker', 'Client', 'Consultant'], default: 'Worker' },
    assignedAt: { type: Date, default: Date.now }
});

const budgetItemSchema = new mongoose.Schema({
    category: { type: String, enum: ['Materials', 'Labor', 'Equipment', 'Permits', 'Other'], required: true },
    planned: { type: Number, default: 0 },
    actual: { type: Number, default: 0 }
});

const projectSchema = new mongoose.Schema({
    title: { type: String, required: [true, 'Project title is required'], trim: true },
    description: { type: String }, // Rich text support expected from frontend
    artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client: { type: String },
    status: { 
        type: String, 
        enum: ['planned', 'in_progress', 'completed', 'archived', 'on_hold', 'soft_deleted'], 
        default: 'planned' 
    },
    startDate: { type: Date },
    endDate: { type: Date },
    location: { type: String }, // Renamed from address for clarity
    
    // Core Tracking
    milestones: [milestoneSchema],
    progress: { type: Number, default: 0 },
    
    // Collaboration
    team: [teamMemberSchema],
    tasks: [taskSchema],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: String,
        mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        createdAt: { type: Date, default: Date.now }
    }],
    
    // Financials
    budget: [budgetItemSchema],
    expenses: [{
        category: String,
        amount: Number,
        date: { type: Date, default: Date.now },
        description: String,
        receipt: String // URL to document
    }],
    
    // Content
    notes: [{
        content: String,
        category: { type: String, default: 'Progress' },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        history: [{
            before: String,
            after: String,
            updatedAt: { type: Date, default: Date.now }
        }],
        createdAt: { type: Date, default: Date.now }
    }],
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    
    // Lifecycle Management
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    archivedAt: { type: Date },
    reasonsForArchive: String,
    
    history: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        action: String,
        changes: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true,
});

// Auto-calculate progress based on milestones
projectSchema.pre('save', async function() {
    if (this.milestones && this.milestones.length > 0) {
        const total = this.milestones.length;
        const weights = this.milestones.reduce((acc, m) => acc + (m.percentage || 0), 0);
        this.progress = Math.round(weights / total);
    }
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
