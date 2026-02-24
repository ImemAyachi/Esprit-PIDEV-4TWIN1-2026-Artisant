const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '30d',
        }
    );
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = signToken(user);

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user },
    });
};

exports.register = async (req, res) => {
    try {
        const { companyName, email, password, phone, role } = req.body;

        if (!companyName || !email || !password || !phone) {
            return res.status(400).json({
                message: 'Please provide all required fields',
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists',
            });
        }

        const user = await User.create({
            companyName,
            email,
            password,
<<<<<<< HEAD
=======
            role: (role || 'artisan').toLowerCase(),
>>>>>>> origin/ala
            phone,
            role,
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Please provide email and password',
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                message: 'Invalid credentials',
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: 'Account is deactivated',
            });
        }

        const isMatch = await user.comparePassword(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid credentials',
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password -facialFingerprint');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        res.status(200).json({
            status: 'success',
            data: { user },
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const allowedFields = ['companyName', 'phone'];
        const updates = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password -facialFingerprint');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { user },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};