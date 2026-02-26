const express = require('express');
const { register, login, getMe, loginWithFace } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/login-face', loginWithFace);
router.get('/me', protect, getMe);

module.exports = router;
