import express from 'express';
import Review from '../models/Review.model.js';
import Project from '../models/Project.model.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/product/:productId', asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, isHidden: false })
    .populate('author', 'firstName lastName avatar role companyName')
    .sort({ createdAt: -1 });
  res.json({ success: true, reviews, count: reviews.length });
}));

/** Feedback liés à un chantier (étoiles + commentaire), visibles par le manager et les artisans du projet */
router.get('/project/:projectId', protect, asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) throw new AppError('Projet introuvable', 404);

  const uid = req.user._id.toString();
  const mgrId = (project.manager?._id || project.manager).toString();
  const onTeam = (project.artisans || []).some(
    (a) => String(a.artisan?._id || a.artisan) === uid
  );
  if (mgrId !== uid && !onTeam && req.user.role !== 'SuperAdmin') {
    throw new AppError('Non autorisé', 403);
  }

  const reviews = await Review.find({
    project: req.params.projectId,
    isHidden: false,
  })
    .populate('author', 'firstName lastName avatar role')
    .populate('artisan', 'firstName lastName craft avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, reviews, count: reviews.length });
}));

/** Tous les avis reçus par un artisan (dont feedback chantier) */
router.get('/artisan/:artisanId', protect, asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    artisan: req.params.artisanId,
    isHidden: false,
  })
    .populate('author', 'firstName lastName avatar role')
    .populate('project', 'title status')
    .sort({ createdAt: -1 });

  res.json({ success: true, reviews, count: reviews.length });
}));

router.post('/', protect, asyncHandler(async (req, res) => {
  const {
    productId,
    artisanId,
    projectId,
    rating,
    isRecommended,
    title,
    comment,
    pros,
    cons,
  } = req.body;

  const reviewData = {
    author: req.user._id,
    rating,
    isRecommended,
    title,
    comment,
    pros,
    cons,
  };

  if (projectId) {
    if (req.user.role !== 'Architecte') {
      throw new AppError('Seuls les architectes peuvent envoyer un feedback sur un chantier', 403);
    }
    if (productId) throw new AppError('Un feedback chantier ne peut pas cibler un produit', 400);
    if (!artisanId) throw new AppError('Artisan requis pour un feedback chantier', 400);
    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      throw new AppError('La note doit être entre 1 et 5', 400);
    }
    if (!comment || !String(comment).trim()) {
      throw new AppError('Le commentaire est obligatoire', 400);
    }

    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Projet introuvable', 404);

    const mgrId = (project.manager?._id || project.manager).toString();
    if (mgrId !== req.user._id.toString()) {
      throw new AppError('Seul le responsable du chantier peut noter les artisans', 403);
    }

    const member = (project.artisans || []).find(
      (a) => String(a.artisan?._id || a.artisan) === String(artisanId)
    );
    if (!member) throw new AppError('Cet artisan ne fait pas partie de ce chantier', 400);
    if (!['accepted', 'completed'].includes(member.status)) {
      throw new AppError('Vous ne pouvez noter que les artisans avec un statut accepté ou terminé', 400);
    }

    reviewData.project = projectId;
    reviewData.artisan = artisanId;
    reviewData.comment = String(comment).trim();
  } else {
    if (productId) reviewData.product = productId;
    if (artisanId) reviewData.artisan = artisanId;
  }

  if (!reviewData.product && !reviewData.artisan) {
    throw new AppError('Ciblez un produit, un artisan, ou un chantier + artisan', 400);
  }

  let review;
  try {
    review = await Review.create(reviewData);
  } catch (e) {
    if (e?.code === 11000) {
      throw new AppError('Vous avez déjà laissé un avis pour ce cas', 400);
    }
    throw e;
  }

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
    .populate('project', 'title')
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
