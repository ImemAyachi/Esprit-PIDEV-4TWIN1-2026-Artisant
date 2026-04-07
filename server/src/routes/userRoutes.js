import express from 'express';
import {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    updateUserRole,
    toggleAccountStatus
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Protect all routes
router.use(authorize('admin')); // Restrict all routes to admin

router.get('/', getAllUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/role', updateUserRole);
router.patch('/:id/toggle-status', toggleAccountStatus);

export default router;
