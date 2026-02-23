const Project = require('../models/Project');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Artisan)
exports.createProject = async (req, res) => {
    try {
        const { title, description, address, startDate, endDate, url_resume_vocal } = req.body;

        const project = await Project.create({
            title,
            description,
            address,
            startDate,
            endDate,
            url_resume_vocal,
            artisan: req.user.id
        });

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
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
            data: projects
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
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
            data: projects
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};
