/**
 * Admin Controller — Gestion globale (SuperAdmin uniquement)
 *
 * GET  /api/admin/dashboard    — Stats globales
 * GET  /api/admin/users        — Liste tous les utilisateurs
 * PUT  /api/admin/users/:id/verify   — Valider un professionnel
 * PUT  /api/admin/users/:id/toggle   — Activer/Désactiver un compte
 * DELETE /api/admin/users/:id        — Supprimer un utilisateur
 */
import User from '../models/User.model.js';
import Product from '../models/Product.model.js';
import Quote from '../models/Quote.model.js';
import Order from '../models/Order.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export const getDashboard = asyncHandler(async (req, res) => {
  // Exécuter toutes les stats en parallèle pour la perf
  const [
    totalUsers,
    usersByRole,
    totalProducts,
    totalQuotes,
    totalOrders,
    recentUsers,
    pendingVerification,
    monthlyRevenue,
  ] = await Promise.all([
    User.countDocuments(),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Product.countDocuments(),
    Quote.countDocuments(),
    Order.countDocuments(),
    User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email role createdAt'),
    User.countDocuments({ isVerified: false, role: { $ne: 'SuperAdmin' } }),
    Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: {
            year:  { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          count:   { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]),
  ]);

  res.json({
    success: true,
    dashboard: {
      totalUsers,
      usersByRole,
      totalProducts,
      totalQuotes,
      totalOrders,
      pendingVerification,
      recentUsers,
      monthlyRevenue: monthlyRevenue.reverse(), // Ordre chronologique
    },
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, isActive, isVerified, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role)       filter.role       = role;
  if (isActive !== undefined) filter.isActive   = isActive === 'true';
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName:  { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    users,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

export const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isVerified: true },
    { new: true }
  );
  if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });

  res.json({ success: true, message: `${user.firstName} ${user.lastName} vérifié`, user });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: `Compte ${user.isActive ? 'activé' : 'désactivé'}`,
    user,
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
  if (user.role === 'SuperAdmin') {
    return res.status(403).json({ success: false, message: 'Impossible de supprimer un SuperAdmin' });
  }

  await user.deleteOne();
  res.json({ success: true, message: 'Utilisateur supprimé' });
});
