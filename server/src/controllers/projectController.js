const Project = require('../models/Project');

// Helper to track history
const addHistory = (project, user, action, changes) => {
    project.history.push({ user, action, changes, timestamp: new Date() });
};

// @desc    Get all projects with advanced filtering
// @route   GET /api/projects/my
exports.getMyProjects = async (req, res) => {
    try {
        const { status, search, limit = 50, skip = 0, deleted = 'false' } = req.query;
        let query = { artisan: req.user.id };

        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: 'i' };
        if (deleted === 'true') query.isDeleted = true;
        else query.isDeleted = false;

        const projects = await Project.find(query)
            .sort('-updatedAt')
            .limit(Number(limit))
            .skip(Number(skip));

        res.status(200).json({ success: true, count: projects.length, data: projects });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get detailed project
// @route   GET /api/projects/:id
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('artisan', 'companyName')
            .populate('team.user', 'name email companyName')
            .populate('tasks.assignedTo', 'name')
            .populate('comments.user', 'name')
            .populate('documents');

        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create project with wizard support
// @route   POST /api/projects
exports.createProject = async (req, res) => {
    try {
        const project = await Project.create({
            ...req.body,
            artisan: req.user.id
        });
        addHistory(project, req.user.id, 'Created', { initialData: req.body });
        await project.save();
        res.status(201).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update project with history tracking
// @route   PUT /api/projects/:id
exports.updateProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Not found' });

        // Logic check: Completion rule
        if (req.body.status === 'completed') {
            const pendingMilestones = project.milestones.filter(m => m.status !== 'Completed');
            if (pendingMilestones.length > 0) {
                return res.status(400).json({ message: 'Cannot complete project with pending milestones' });
            }
        }

        addHistory(project, req.user.id, 'Updated', req.body);
        Object.assign(project, req.body);
        await project.save();

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Bulk update projects
// @route   PATCH /api/projects/bulk
exports.bulkUpdate = async (req, res) => {
    try {
        const { ids, updates } = req.body;
        await Project.updateMany(
            { _id: { $in: ids }, artisan: req.user.id },
            { $set: updates }
        );
        res.status(200).json({ success: true, message: 'Projects updated in registry' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Soft Delete / Archive
// @route   DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Not found' });

        if (req.user.role === 'admin' || req.query.permanent === 'true') {
            await project.deleteOne();
            return res.json({ success: true, message: 'Project purged from ledger' });
        }

        project.isDeleted = true;
        project.deletedAt = new Date();
        project.status = 'soft_deleted';
        await project.save();
        res.json({ success: true, message: 'Project moved to disposal bin' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Restore project
// @route   PATCH /api/projects/:id/restore
exports.restoreProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        project.isDeleted = false;
        project.status = 'planned';
        await project.save();
        res.json({ success: true, message: 'Project restored to operational status' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Add Milestone
// @route   POST /api/projects/:id/milestones
exports.addMilestone = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        project.milestones.push(req.body);
        await project.save();
        res.json({ success: true, data: project.milestones });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Add/Update Team Member
// @route   POST /api/projects/:id/team
exports.manageTeam = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        const { userId, role } = req.body;
        
        const existing = project.team.find(t => t.user.toString() === userId);
        if (existing) existing.role = role;
        else project.team.push({ user: userId, role });

        await project.save();
        res.json({ success: true, data: project.team });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Add Comment
// @route   POST /api/projects/:id/comments
exports.addComment = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        project.comments.push({
            user: req.user.id,
            content: req.body.content,
            mentions: req.body.mentions || []
        });
        await project.save();
        res.json({ success: true, message: 'Comment synchronized' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Manage Budget
// @route   PATCH /api/projects/:id/budget
exports.updateBudgetAllocations = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        project.budget = req.body.budget;
        await project.save();
        res.json({ success: true, data: project.budget });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get All (Admin)
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('artisan', 'companyName');
        res.json({ success: true, data: projects });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
