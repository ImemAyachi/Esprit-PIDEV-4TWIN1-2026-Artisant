const User = require('../models/User');
const Project = require('../models/Project');
const Order = require('../models/Order');

// @desc    Get public statistics for landing page
// @route   GET /api/public/stats
// @access  Public
exports.getStats = async (req, res) => {
    try {
        const artisanCount = await User.countDocuments({ role: 'artisan' });
        const manufacturerCount = await User.countDocuments({ role: 'manufacturer' });
        const projectCount = await Project.countDocuments();

        // Sum total amount of all orders for transaction volume
        const orders = await Order.find({}, 'totalAmount');
        const totalVolume = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        res.status(200).json({
            success: true,
            data: {
                artisans: artisanCount,
                manufacturers: manufacturerCount,
                projects: projectCount,
                volume: totalVolume
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
