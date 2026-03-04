const express = require('express');
const { register, login, loginWithFace, enrollFace, removeFace, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/login/face', loginWithFace);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me/profile', protect, updateProfile);
router.post('/me/face/enroll', protect, enrollFace);
router.delete('/me/face', protect, removeFace);

module.exports = router;
