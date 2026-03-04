const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = signToken(user);
    user.password = undefined;
    user.faceEmbedding = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user },
    });
};

// ─── Password Register ──────────────────────────────────────────────────────
exports.register = async (req, res) => {
    try {
        const { companyName, email, password, phone, role, faceEmbedding } = req.body;

        if (!companyName || !email || !password || !phone) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            companyName,
            email,
            password,
            role: (role || 'artisan').toLowerCase(),
            phone,
            faceEmbedding: faceEmbedding || [],
            hasFaceAuth: !!(faceEmbedding && faceEmbedding.length > 0)
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Password Login ─────────────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });
        if (!user.password) return res.status(400).json({ message: 'This account uses Face ID login only' });

        const isMatch = await user.comparePassword(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Face Login ─────────────────────────────────────────────────────────────
exports.loginWithFace = async (req, res) => {
    try {
        const { email, faceEmbedding } = req.body;

        if (!email || !faceEmbedding || !Array.isArray(faceEmbedding)) {
            return res.status(400).json({ message: 'Email and face data are required' });
        }

        const user = await User.findOne({ email }).select('+faceEmbedding');
        if (!user) return res.status(401).json({ message: 'No account found with this email' });
        if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });
        if (!user.hasFaceAuth || !user.faceEmbedding || user.faceEmbedding.length === 0) {
            return res.status(400).json({ message: 'Face ID is not set up for this account' });
        }

        const similarity = user.compareFaceEmbedding(faceEmbedding);

        // Threshold: 0.85 cosine similarity
        if (similarity < 0.85) {
            return res.status(401).json({
                message: 'Face not recognized. Please try again or use your password.',
                similarity,
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Enroll Face (authenticated) ────────────────────────────────────────────
exports.enrollFace = async (req, res) => {
    try {
        const { faceEmbedding } = req.body;
        if (!faceEmbedding || !Array.isArray(faceEmbedding) || faceEmbedding.length === 0) {
            return res.status(400).json({ message: 'Valid face embedding required' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { faceEmbedding, hasFaceAuth: true },
            { new: true }
        ).select('-password -faceEmbedding');

        res.status(200).json({
            status: 'success',
            message: 'Face ID enrolled successfully',
            data: { user },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Remove Face (authenticated) ────────────────────────────────────────────
exports.removeFace = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { faceEmbedding: [], hasFaceAuth: false },
            { new: true }
        ).select('-password -faceEmbedding');

        res.status(200).json({
            status: 'success',
            message: 'Face ID removed',
            data: { user },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Get Me ─────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -faceEmbedding');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ status: 'success', data: { user } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Update Profile ──────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const allowedFields = ['companyName', 'phone'];
        const updates = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password -faceEmbedding');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ status: 'success', data: { user } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};