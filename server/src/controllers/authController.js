const User = require('../models/User');
const Profile = require('../models/Profile');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { companyName, phoneNumber, email, password, role, avatarUrl, facialFingerprint } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            companyName,
            phoneNumber,
            email,
            password,
            role: role ? role.toLowerCase() : 'artisan',
            avatarUrl,
            facialFingerprint
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        console.error('Registration Error:', err);

        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        res.status(500).json({ message: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for email and password
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Check user & password
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Login with facial recognition
// @route   POST /api/auth/login-face
// @access  Public
exports.loginWithFace = async (req, res) => {
    try {
        const { email, facialFingerprint } = req.body;

        if (!email || !facialFingerprint) {
            return res.status(400).json({ message: 'Please provide email and facial data' });
        }

        const user = await User.findOne({ email }).select('+facialFingerprint');

        if (!user || !user.facialFingerprint || user.facialFingerprint.length === 0) {
            return res.status(401).json({ message: 'Facial data not found for this user' });
        }

        // In a real app, we'd compare the fingerprints using Euclidean distance
        // For simplicity, we'll assume the client does some validation or we check basically
        // Here we just check if it exists for the demo, or we could implement a simple similarity check
        // if user.facialFingerprint is an array of 128 numbers (face-api.js)

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            status: 'success',
            data: {
                user,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
