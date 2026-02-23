const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
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

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
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

// @desc    Toggle user account active/inactive status
// @route   PATCH /api/users/:id/toggle-status
// @access  Private/Admin
exports.toggleAccountStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deactivating their own account
        if (req.user._id.toString() === req.params.id) {
            return res.status(400).json({ message: 'You cannot deactivate your own account' });
        }

        user.isActive = !user.isActive;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            data: {
                user,
                message: `Account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            status: 'success',
            data: null,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
