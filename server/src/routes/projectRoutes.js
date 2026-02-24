const express = require('express');
const {
    createProject,
    getMyProjects,
    getAllProjects
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorize('admin'), getAllProjects)
    .post(authorize('artisan', 'admin'), createProject);

router.get('/my', authorize('artisan'), getMyProjects);

module.exports = router;
