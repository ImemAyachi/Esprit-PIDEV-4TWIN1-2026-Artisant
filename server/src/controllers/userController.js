const User = require('../models/User');

// @desc    Get all users (Admin)
// @route   GET /api/users
exports.getAllUsers = async (req, res) => {
    try {
        const { search, role, status } = req.query;
        let query = {};
        
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) query.role = role;
        if (status !== undefined) query.isActive = status === 'true';

        const users = await User.find(query).select('-password -faceEmbedding');

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: { users },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -faceEmbedding');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).select('-password -faceEmbedding');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ status: 'success', message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const allowedRoles = ['artisan', 'manufacturer', 'expert', 'admin'];
        if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password -faceEmbedding');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};