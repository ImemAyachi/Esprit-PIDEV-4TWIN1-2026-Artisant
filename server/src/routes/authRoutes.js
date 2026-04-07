import express from 'express';
import { register, login, loginWithFace, enrollFace, getMe, 
    updateProfile, deleteAccount, getSessions, deleteSession
 } from '../controllers/authController.js';

import { protect  } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/login/face', loginWithFace);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me/profile', protect, updateProfile);
router.delete('/me/account', protect, deleteAccount);
router.post('/me/face/enroll', protect, enrollFace);

// Session routes
router.get('/me/sessions', protect, getSessions);
router.delete('/me/sessions/:id', protect, deleteSession);

export default router;


