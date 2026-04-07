/**
 * Routes Utilisateurs — Recherche artisans et fournisseurs
 */
import express from 'express';
import User from '../models/User.model.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Recherche d'artisans (public ou connecté)
router.get('/artisans', asyncHandler(async (req, res) => {
  const { craft, city, minRating, page = 1, limit = 12, search } = req.query;

  const filter = { role: 'Artisan', isActive: true, isVerified: true };
  if (craft) filter.craft = craft;
  if (city)  filter['location.city'] = { $regex: city, $options: 'i' };
  if (minRating) filter['rating.average'] = { $gte: Number(minRating) };
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [artisans, total] = await Promise.all([
    User.find(filter)
      .select('firstName lastName avatar craft location rating experience')
      .sort({ 'rating.average': -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    artisans,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
}));

// Profil public d'un utilisateur
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -resetPasswordToken -resetPasswordExpire -lastLogin');

  if (!user || !user.isActive) throw new AppError('Utilisateur introuvable', 404);
  res.json({ success: true, user });
}));

export default router;
