const User = require('../models/User');
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
        const { companyName, email, password, role, phone, avatarUrl, facialFingerprint } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            companyName,
            email,
            password,
            role: (role || 'artisan').toLowerCase(),
            phone,
            avatarUrl,
            facialFingerprint
        });

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

// @desc    Update current user's profile
// @route   PUT /api/auth/me/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { companyName, phone, avatarUrl } = req.body;

        // Build update object with only provided fields
        const updateFields = {};
        if (companyName !== undefined) updateFields.companyName = companyName;
        if (phone !== undefined) updateFields.phone = phone;
        if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;

        const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
            new: true,
            runValidators: true,
        });

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
