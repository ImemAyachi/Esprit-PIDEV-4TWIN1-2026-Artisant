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
        const { name, email, password, role } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role,
        });

        // Create empty profile
        await Profile.create({ user: user._id });

        sendTokenResponse(user, 201, res);
    } catch (err) {
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

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({ message: 'Your account has been deactivated. Please contact an administrator.' });
        }

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
        const user = await User.findById(req.user.id).populate('profile');
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
