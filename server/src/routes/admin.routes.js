/**
 * Routes Admin — SuperAdmin uniquement
 *
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administration — SuperAdmin uniquement
 */
import express from 'express';
import {
  getDashboard, getAllUsers, verifyUser, toggleUserStatus, deleteUser,
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Toutes les routes admin nécessitent d'être SuperAdmin
router.use(protect, authorize('SuperAdmin'));

router.get('/dashboard',          getDashboard);
router.get('/users',              getAllUsers);
router.put('/users/:id/verify',   verifyUser);
router.put('/users/:id/toggle',   toggleUserStatus);
router.delete('/users/:id',       deleteUser);

export default router;
