const Project = require('../models/Project');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Artisan)
exports.createProject = async (req, res) => {
    try {
        const { title, description, address, city, startDate, endDate, budget, status } = req.body;

        const project = await Project.create({
            title,
            description,
            location: { address, city },
            startDate,
            endDate,
            budget,
            status,
            artisan: req.user.id,
        });

        res.status(201).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all projects for the logged in artisan
// @route   GET /api/projects/my
// @access  Private (Artisan)
exports.getMyProjects = async (req, res) => {
    try {
        const projects = await Project.find({ artisan: req.user.id }).sort('-createdAt');

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Artisan – own projects only)
exports.updateProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (project.artisan.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
        }

        const { title, description, address, city, startDate, endDate, budget, status } = req.body;

        project = await Project.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                location: { address, city },
                startDate,
                endDate,
                budget,
                status,
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (Artisan – own projects only)
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (project.artisan.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
        }

        await project.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Archive a project
// @route   PATCH /api/projects/:id/archive
// @access  Private (Artisan – own projects only)
exports.archiveProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (project.artisan.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        project.status = project.status === 'archived' ? 'planned' : 'archived';
        await project.save();

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all projects (Admin only)
// @route   GET /api/projects
// @access  Private (Admin)
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('artisan', 'name email companyName');

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
