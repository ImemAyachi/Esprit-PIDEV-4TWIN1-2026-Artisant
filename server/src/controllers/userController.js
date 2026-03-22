const User = require('../models/User');

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

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
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
            data: { user },
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
        const { role, reason } = req.body;

        const allowedRoles = ['artisan', 'manufacturer', 'expert', 'admin'];
        if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });

        if (req.user._id.toString() === req.params.id && role !== 'admin') {
            return res.status(400).json({ message: 'Admin cannot change their own role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const oldRole = user.role;
        user.role = role;
        
        user.roleChangeHistory.push({
            oldRole,
            newRole: role,
            reason: reason || 'Not provided',
            changedBy: req.user._id
        });

        await user.save({ validateBeforeSave: false });

        res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Temporary Role Elevation ───────────────────────────────────────────────
exports.elevateUserPermissions = async (req, res) => {
    try {
        const { role, durationHours } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const expiresAt = new Date(Date.now() + durationHours * 3600000);
        
        user.temporaryPermissions.push({
            role,
            expiresAt,
            grantedBy: req.user._id
        });

        await user.save({ validateBeforeSave: false });
        res.status(200).json({ status: 'success', message: `Temporary ${role} permissions granted until ${expiresAt.toLocaleString()}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Bulk Operations ──────────────────────────────────────────────────────────
exports.bulkUserAction = async (req, res) => {
    try {
        const { userIds, action, role } = req.body;
        if (!Array.isArray(userIds)) return res.status(400).json({ message: 'userIds must be an array' });

        if (action === 'activate') {
            await User.updateMany({ _id: { $in: userIds } }, { isActive: true });
        } else if (action === 'deactivate') {
            await User.updateMany({ _id: { $in: userIds } }, { isActive: false });
        } else if (action === 'assignRole' && role) {
            await User.updateMany({ _id: { $in: userIds } }, { role });
        }

        res.status(200).json({ status: 'success', message: 'Bulk action completed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── User Impersonation ───────────────────────────────────────────────────────
exports.impersonateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // In a real app, generate a new token for this user
        // We set a flag on the token or response to indicate impersonation
        res.status(200).json({ 
            status: 'success', 
            message: `Impersonating ${user.email}`,
            data: { user, isImpersonating: true }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Activity Monitoring ──────────────────────────────────────────────────────
exports.getUserActivity = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('activityLog lastLogin lastIP loginCount');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ status: 'success', data: { activity: user.activityLog, lastLogin: user.lastLogin, lastIP: user.lastIP, loginCount: user.loginCount } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};