import Project from '../models/Project.js';

// @desc    Get all projects for the logged-in artisan
// @route   GET /api/projects/my
export const getMyProjects = async (req, res) => {
    try {
        const projects = await Project.find({ artisan: req.user.id }).sort('-createdAt');
        
        // Map statuses for frontend compatibility
        const mappedProjects = projects.map(p => ({
            ...p.toObject(),
            status: p.status === 'en_cours' ? 'in_progress' : 
                    p.status === 'planifié' ? 'planned' : 
                    p.status === 'terminé' ? 'completed' : 
                    p.status === 'archivé' ? 'archived' : p.status
        }));

        res.status(200).json({ success: true, count: projects.length, data: mappedProjects });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Archive project
// @route   PATCH /api/projects/:id/archive
export const archiveProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, { status: 'archivé' }, { new: true });
        if (!project) return res.status(404).json({ message: 'Not found' });
        
        const mappedProject = {
            ...project.toObject(),
            status: 'archived'
        };

        res.status(200).json({ success: true, data: mappedProject });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get detailed project
// @route   GET /api/projects/:id
export const getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('artisan', 'email companyName phone');
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        const mappedProject = {
            ...project.toObject(),
            status: project.status === 'en_cours' ? 'in_progress' : 
                    project.status === 'planifié' ? 'planned' : 
                    project.status === 'terminé' ? 'completed' : 
                    project.status === 'archivé' ? 'archived' : project.status
        };

        res.status(200).json({ success: true, data: mappedProject });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create project
// @route   POST /api/projects
export const createProject = async (req, res) => {
    try {
        const project = await Project.create({
            ...req.body,
            artisan: req.user.id
        });
        res.status(201).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
export const updateProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!project) return res.status(404).json({ message: 'Not found' });
        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ message: 'Not found' });
        res.json({ success: true, message: 'Project deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get All (Admin)
export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('artisan', 'email companyName');
        res.json({ success: true, data: projects });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

