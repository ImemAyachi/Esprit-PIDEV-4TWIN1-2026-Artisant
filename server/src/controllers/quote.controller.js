/**
 * Quote Controller — Flux complet de devis
 *
 * Architecte/Ingénieur → demande de devis → Artisan répond → Architecte accepte
 *
 * POST   /api/quotes           — Créer une demande (Architecte/Ingénieur)
 * GET    /api/quotes           — Mes devis (selon le rôle)
 * GET    /api/quotes/:id       — Détail d'un devis
 * PUT    /api/quotes/:id/submit — Artisan soumet son devis
 * PUT    /api/quotes/:id/accept — Architecte accepte
 * PUT    /api/quotes/:id/refuse — Architecte refuse
 */
import Quote from '../models/Quote.model.js';
import Notification from '../models/Notification.model.js';
import Project from '../models/Project.model.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

/**
 * @swagger
 * /quotes:
 *   post:
 *     summary: Créer une demande de devis (Architecte/Ingénieur → Artisan)
 *     tags: [Quotes]
 */
export const createQuote = asyncHandler(async (req, res) => {
  const { artisanId, title, description, location, desiredDeadline, projectId } = req.body;

  const quote = await Quote.create({
    requester: req.user._id,
    artisan: artisanId,
    title,
    description,
    location,
    desiredDeadline,
    project: projectId || undefined,
    status: 'open',
    statusHistory: [{
      status: 'open',
      changedBy: req.user._id,
    }],
  });

  // Notifier l'artisan en temps réel via Socket.io
  const notification = await Notification.create({
    recipient: artisanId,
    type: 'quote_received',
    title: 'Nouvelle demande de devis',
    message: `${req.user.firstName} ${req.user.lastName} vous demande un devis pour : ${title}`,
    link: `/quotes/${quote._id}`,
    data: { quoteId: quote._id },
  });

  // Pousser la notification en temps réel
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${artisanId}`).emit('notification', notification);
  }

  // Si lié à un projet, ajouter le devis au projet
  if (projectId) {
    await Project.findByIdAndUpdate(projectId, { $push: { quotes: quote._id } });
  }

  res.status(201).json({ success: true, quote });
});

/**
 * @swagger
 * /quotes:
 *   get:
 *     summary: Récupérer les devis (filtrés par rôle)
 *     tags: [Quotes]
 */
export const getMyQuotes = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  // Filtre basé sur le rôle : l'artisan voit ses demandes, l'architecte ses envois
  let filter = {};
  if (['Architecte', 'Ingenieur'].includes(req.user.role)) {
    filter.requester = req.user._id;
  } else if (req.user.role === 'Artisan') {
    filter.artisan = req.user._id;
  }

  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [quotes, total] = await Promise.all([
    Quote.find(filter)
      .populate('requester', 'firstName lastName avatar role')
      .populate('artisan', 'firstName lastName avatar craft rating')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Quote.countDocuments(filter),
  ]);

  res.json({
    success: true,
    quotes,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  });
});

export const getQuoteById = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id)
    .populate('requester', 'firstName lastName avatar email phone location')
    .populate('artisan', 'firstName lastName avatar craft rating location phone')
    .populate('project', 'title location status');

  if (!quote) throw new AppError('Devis introuvable', 404);

  // Vérifier que l'utilisateur est concerné
  const involved =
    quote.requester._id.equals(req.user._id) ||
    quote.artisan._id.equals(req.user._id) ||
    req.user.role === 'SuperAdmin';

  if (!involved) throw new AppError('Accès refusé', 403);

  res.json({ success: true, quote });
});

/**
 * Artisan soumet son devis avec les lignes de détail et les montants
 */
export const submitQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) throw new AppError('Devis introuvable', 404);

  // Seul l'artisan concerné peut soumettre
  if (!quote.artisan.equals(req.user._id)) throw new AppError('Accès refusé', 403);
  if (quote.status !== 'open') throw new AppError(`Impossible de soumettre un devis en statut '${quote.status}'`, 400);

  const { items, proposedDeadline, notes } = req.body;

  quote.items = items;
  quote.proposedDeadline = proposedDeadline;
  quote.notes = notes;
  quote.status = 'pending';
  quote.statusHistory.push({ status: 'pending', changedBy: req.user._id });

  await quote.save(); // Déclenche le calcul auto du totalAmount

  // Notifier le demandeur
  const notification = await Notification.create({
    recipient: quote.requester,
    type: 'quote_submitted',
    title: 'Devis soumis',
    message: `${req.user.firstName} a soumis un devis de ${quote.totalAmount} TND pour : ${quote.title}`,
    link: `/quotes/${quote._id}`,
    data: { quoteId: quote._id, amount: quote.totalAmount },
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user_${quote.requester}`).emit('notification', notification);
  }

  res.json({ success: true, quote });
});

/**
 * Architecte/Ingénieur accepte le devis
 */
export const acceptQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) throw new AppError('Devis introuvable', 404);

  if (!quote.requester.equals(req.user._id)) throw new AppError('Accès refusé', 403);
  if (quote.status !== 'pending') throw new AppError('Devis non soumis', 400);

  quote.status = 'accepted';
  quote.statusHistory.push({ status: 'accepted', changedBy: req.user._id });
  await quote.save();

  // ÉTAPE CLÉ : Ajouter automatiquement l'artisan au chantier
  if (quote.project) {
    const Project = await import('../models/Project.model.js').then((m) => m.default);
    const User = await import('../models/User.model.js').then((m) => m.default);

    const project = await Project.findById(quote.project);
    if (project) {
      // Vérifier si l'artisan est déjà inscrit (pour éviter les doublons)
      const isAlreadyAdded = project.artisans.some(a => a.artisan.toString() === quote.artisan.toString());

      if (!isAlreadyAdded) {
        const artisanInfo = await User.findById(quote.artisan);
        project.artisans.push({
          artisan: quote.artisan,
          role: artisanInfo?.craft || 'Intervenant',
          status: 'accepted',
          totalAmount: quote.totalAmount // On enregistre le prix ICI
        });
      } else {
        // S'il était déjà invité, on met à jour son statut et son prix
        const member = project.artisans.find(a => a.artisan.toString() === quote.artisan.toString());
        member.status = 'accepted';
        member.totalAmount = quote.totalAmount;
      }

      // Mise à jour financière (ajouter le montant du devis aux revenus du projet)
      project.financials.totalRevenue += quote.totalAmount;

      await project.save();
    }
  }

  // Notifier l'artisan
  const notification = await Notification.create({
    recipient: quote.artisan,
    type: 'quote_accepted',
    title: 'Devis accepté !',
    message: `Votre devis de ${quote.totalAmount} TND pour "${quote.title}" a été accepté`,
    link: `/quotes/${quote._id}`,
    data: { quoteId: quote._id },
  });
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${quote.artisan}`).emit('notification', notification);
  }

  res.json({ success: true, quote });
});

/**
 * Architecte/Ingénieur refuse le devis
 */
export const refuseQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) throw new AppError('Devis introuvable', 404);

  if (!quote.requester.equals(req.user._id)) throw new AppError('Accès refusé', 403);
  if (!['pending', 'open'].includes(quote.status)) throw new AppError('Statut invalide', 400);

  const { reason } = req.body;
  quote.status = 'refused';
  quote.statusHistory.push({ status: 'refused', changedBy: req.user._id, reason });
  await quote.save();

  const notification = await Notification.create({
    recipient: quote.artisan,
    type: 'quote_refused',
    title: 'Devis refusé',
    message: `Votre devis pour "${quote.title}" a été refusé${reason ? ` : ${reason}` : ''}`,
    link: `/quotes/${quote._id}`,
  });
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${quote.artisan}`).emit('notification', notification);
  }

  res.json({ success: true, quote });
});
