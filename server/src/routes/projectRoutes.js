const express = require('express');
const {
    createProject,
    getMyProjects,
    getProject,
    getAllProjects,
    updateProject,
    deleteProject,
    bulkUpdate,
    restoreProject,
    addMilestone,
    manageTeam,
    addComment,
    updateBudgetAllocations
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Admin: list all projects
router.get('/', authorize('admin'), getAllProjects);

// Basic CRUD
router.get('/my', authorize('artisan', 'admin'), getMyProjects);
router.get('/:id', authorize('artisan', 'admin', 'expert'), getProject);
router.post('/', authorize('artisan', 'admin'), createProject);
router.put('/:id', authorize('artisan', 'admin'), updateProject);
router.delete('/:id', authorize('artisan', 'admin'), deleteProject);

// Advanced Operations
router.patch('/bulk', authorize('artisan', 'admin'), bulkUpdate);
router.patch('/:id/restore', authorize('artisan', 'admin'), restoreProject);

// Module Specific
router.post('/:id/milestones', authorize('artisan', 'admin'), addMilestone);
router.post('/:id/team', authorize('artisan', 'admin'), manageTeam);
router.post('/:id/comments', protect, addComment);
router.patch('/:id/budget', authorize('artisan', 'admin'), updateBudgetAllocations);

module.exports = router;

