const express = require('express');
const {
    createProject,
    getMyProjects,
    updateProject,
    deleteProject,
    archiveProject,
    getAllProjects,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Admin: list all projects
router.get('/', authorize('admin'), getAllProjects);

// Artisan: create a project
router.post('/', authorize('artisan', 'admin'), createProject);

// Artisan: get their own projects
router.get('/my', authorize('artisan'), getMyProjects);

// Artisan: update or delete their own project
router.put('/:id', authorize('artisan', 'admin'), updateProject);
router.patch('/:id/archive', authorize('artisan', 'admin'), archiveProject);
router.delete('/:id', authorize('artisan', 'admin'), deleteProject);

module.exports = router;
