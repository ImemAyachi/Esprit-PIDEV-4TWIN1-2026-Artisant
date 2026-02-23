const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password -facialFingerprint');

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -facialFingerprint');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        ).select('-password -facialFingerprint');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'User deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        const allowedRoles = ['artisan', 'manufacturer', 'expert', 'admin'];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                message: 'Invalid role',
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            {
                new: true,
                runValidators: true,
            }
        ).select('-password -facialFingerprint');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};