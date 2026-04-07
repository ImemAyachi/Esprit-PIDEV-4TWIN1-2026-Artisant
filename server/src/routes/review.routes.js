import express from 'express';
import Review from '../models/Review.model.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/product/:productId', asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, isHidden: false })
    .populate('author', 'firstName lastName avatar role companyName')
    .sort({ createdAt: -1 });
  res.json({ success: true, reviews, count: reviews.length });
}));

router.post('/', protect, asyncHandler(async (req, res) => {
  const { productId, artisanId, rating, isRecommended, title, comment, pros, cons } = req.body;

  const reviewData = {
    author: req.user._id,
    rating, isRecommended, title, comment, pros, cons,
  };

  if (productId) reviewData.product = productId;
  if (artisanId) reviewData.artisan = artisanId;

  const review = await Review.create(reviewData);

  // Le hook post-save de Review recalcule automatiquement la note du produit
  res.status(201).json({ success: true, review });
}));

router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Avis introuvable', 404);
  if (!review.author.equals(req.user._id) && req.user.role !== 'SuperAdmin') {
    throw new AppError('Non autorisé', 403);
  }
  await review.deleteOne();
  res.json({ success: true, message: 'Avis supprimé' });
}));

// 5.4 - Super Admin accède à la Gestion des avis et modère (cacher un avis)
router.get('/all', protect, authorize('admin', 'SuperAdmin'), asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('author', 'firstName lastName email companyName')
    .populate('product', 'name category')
    .sort({ createdAt: -1 });
  res.json({ success: true, reviews });
}));

router.patch('/:id/toggle-hide', protect, authorize('admin', 'SuperAdmin'), asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Avis introuvable', 404);

  review.isHidden = !review.isHidden;
  await review.save();

  res.json({ success: true, isHidden: review.isHidden, message: `Avis ${review.isHidden ? 'caché' : 'affiché'} avec succès` });
}));

export default router;
