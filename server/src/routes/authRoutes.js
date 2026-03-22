const express = require('express');
const { 
    register, login, loginWithFace, enrollFace, removeFace, getMe, updateProfile,
    verifyEmail, forgotPassword, resetPassword, toggle2FA, getSessions, deleteSession, deleteAccount 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/login/face', loginWithFace);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me/profile', protect, updateProfile);
router.post('/me/verify-email', protect, verifyEmail);
router.post('/me/2fa/toggle', protect, toggle2FA);
router.get('/me/sessions', protect, getSessions);
router.delete('/me/sessions/:sessionId', protect, deleteSession);
router.delete('/me/account', protect, deleteAccount);
router.post('/me/face/enroll', protect, enrollFace);
router.delete('/me/face', protect, removeFace);

module.exports = router;
