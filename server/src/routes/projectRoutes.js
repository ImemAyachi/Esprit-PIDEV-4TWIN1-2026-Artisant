import express from 'express';
import { createProject,
    getMyProjects,
    getProject,
    getAllProjects,
    updateProject,
    deleteProject,
    archiveProject
 } from '../controllers/projectController.js';
import { protect, authorize  } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Admin: list all projects
router.get('/', authorize('admin'), getAllProjects);

// Basic CRUD
router.get('/my', authorize('artisan', 'admin'), getMyProjects);
router.get('/:id', authorize('artisan', 'admin', 'expert'), getProject);
router.post('/', authorize('artisan', 'admin'), createProject);
router.put('/:id', authorize('artisan', 'admin'), updateProject);
router.patch('/:id/archive', authorize('artisan', 'admin'), archiveProject);
router.delete('/:id', authorize('artisan', 'admin'), deleteProject);


export default router;


