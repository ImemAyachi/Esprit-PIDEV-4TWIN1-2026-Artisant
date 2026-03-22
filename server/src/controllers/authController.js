const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

const sendTokenResponse = async (user, statusCode, req, res) => {
    const token = signToken(user);
    
    // Update session info
    const sessionInfo = {
        device: req.headers['user-agent'] || 'Unknown Device',
        ip: req.ip,
        lastActive: new Date(),
        isCurrent: true
    };
    
    user.sessions = user.sessions || [];
    // Limit to 5 sessions
    if (user.sessions.length >= 5) user.sessions.shift();
    user.sessions.push(sessionInfo);
    
    user.lastLogin = new Date();
    user.lastIP = req.ip;
    user.loginCount = (user.loginCount || 0) + 1;
    
    // Log activity
    user.activityLog = user.activityLog || [];
    if (user.activityLog.length >= 20) user.activityLog.shift();
    user.activityLog.push({ action: 'Login', ip: req.ip });
    
    await user.save({ validateBeforeSave: false });

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.faceEmbedding;
    delete userObj.twoFactorSecret;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user: userObj },
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

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        const user = await User.create({
            companyName,
            email,
            password,
            role: (role || 'artisan').toLowerCase(),
            phone,
            faceEmbedding: faceEmbedding || [],
            hasFaceAuth: !!(faceEmbedding && faceEmbedding.length > 0),
            emailVerificationOTP: otp,
            emailVerificationExpires: otpExpires
        });

        // In a real app, send email here. For now, we return it in response for dev ease
        sendTokenResponse(user, 201, req, res);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Verify Email ────────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.user._id);

        if (user.emailVerificationOTP !== otp || Date.now() > user.emailVerificationExpires) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isEmailVerified = true;
        user.emailVerificationOTP = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ status: 'success', message: 'Email verified successfully' });
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

        sendTokenResponse(user, 200, req, res);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Forgot Password ─────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const resetToken = Math.random().toString(36).slice(-8);
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ status: 'success', message: 'Reset token sent to email', token: resetToken });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Reset Password ──────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ status: 'success', message: 'Password reset successful' });
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

        sendTokenResponse(user, 200, req, res);
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
        const allowedFields = ['companyName', 'phone', 'address', 'professionalDetails', 'avatarUrl'];
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

// ─── 2FA Management ─────────────────────────────────────────────────────────
exports.toggle2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.twoFactorEnabled = !user.twoFactorEnabled;
        if (user.twoFactorEnabled) {
            user.twoFactorSecret = Math.random().toString(36).slice(-10).toUpperCase();
        }
        await user.save({ validateBeforeSave: false });
        res.status(200).json({ status: 'success', data: { enabled: user.twoFactorEnabled, secret: user.twoFactorSecret } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Session Management ─────────────────────────────────────────────────────
exports.getSessions = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('sessions');
        res.status(200).json({ status: 'success', data: { sessions: user.sessions } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.sessions = user.sessions.filter(s => s._id.toString() !== req.params.sessionId);
        await user.save({ validateBeforeSave: false });
        res.status(200).json({ status: 'success', message: 'Session terminated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Account Deletion ───────────────────────────────────────────────────────
exports.deleteAccount = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id);
        // In a real app, also export/delete projects, orders etc or archive them
        res.status(200).json({ status: 'success', message: 'Account deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};