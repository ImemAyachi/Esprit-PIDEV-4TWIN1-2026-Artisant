const express = require('express');
const {
    createProject,
    getMyProjects,
    getAllProjects,
    archiveProject,
    deleteProject
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorize('admin'), getAllProjects)
    .post(authorize('artisan', 'admin'), createProject);

router.get('/my', authorize('artisan'), getMyProjects);
router.patch('/:id/archive', authorize('artisan'), archiveProject);
router.delete('/:id', authorize('artisan'), deleteProject);

module.exports = router;
