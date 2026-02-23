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
            role: role.toLowerCase(),
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
        const { name, bio, phone, address, companyName, specialty, experienceYears, skills, socialLinks } = req.body;

        // Update user name if provided
        if (name) {
            await User.findByIdAndUpdate(req.user.id, { name }, { runValidators: true });
        }

        // Find or create profile
        let profile = await Profile.findOne({ user: req.user.id });
        if (!profile) {
            profile = await Profile.create({ user: req.user.id });
        }

        // Update profile fields
        const profileFields = { bio, phone, address, companyName, specialty, experienceYears, skills, socialLinks };
        Object.keys(profileFields).forEach(key => {
            if (profileFields[key] !== undefined) {
                profile[key] = profileFields[key];
            }
        });
        await profile.save();

        // Return updated user with populated profile
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
