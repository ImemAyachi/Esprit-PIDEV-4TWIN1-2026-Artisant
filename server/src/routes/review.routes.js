import express from 'express';
import Review from '../models/Review.model.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/product/:productId', asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('author', 'firstName lastName avatar role')
    .sort({ createdAt: -1 });
  res.json({ success: true, reviews, count: reviews.length });
}));

router.post('/', protect, asyncHandler(async (req, res) => {
  const { productId, artisanId, rating, isRecommended, title, comment, pros, cons } = req.body;

  const review = await Review.create({
    author:        req.user._id,
    product:       productId,
    artisan:       artisanId,
    rating, isRecommended, title, comment, pros, cons,
  });

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

export default router;
