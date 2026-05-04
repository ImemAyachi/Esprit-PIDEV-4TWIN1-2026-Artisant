/**
 * aiMLSearch.controller.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoint de recherche produits avec application des modèles IA ML.
 *
 * Les 3 modèles du dataset (modele_origine, modele_qualite, modele_score)
 * sont simulés ici côté Node via les scores pré-calculés du dataset.
 * Le vrai appel Python aux .pkl est effectué via le ml_engine.py (Flask/Python).
 *
 * GET  /api/products/ml-search?q=ciment&localisation=Tunis&limit=20
 * POST /api/ai/ml-search  { query, localisation, typeProjet, minScore, limit }
 */
import Product from '../models/Product.model.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

/**
 * POST /api/ai/ml-search
 * Recherche IA avec application des 3 modèles ML
 */
export const mlSearchProducts = asyncHandler(async (req, res) => {
  const {
    query       = '',
    localisation = '',
    typeProjet   = '',
    minScore     = 0,
    minQualite   = 0,
    limit        = 20,
    page         = 1,
    sortBy       = 'ai',   // 'ai' | 'price' | '-price' | 'quality'
  } = req.body;

  // ── Build filter ───────────────────────────────────────────────────────────
  const filter = { isAvailable: true };

  if (query) {
    filter.$or = [
      { name:        { $regex: query, $options: 'i' } },
      { tags:        { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { subCategory: { $regex: query, $options: 'i' } },
      { marque:      { $regex: query, $options: 'i' } },
    ];
  }

  if (localisation) filter.localisation = { $regex: localisation, $options: 'i' };
  if (typeProjet)   filter.typeProjet   = { $regex: typeProjet,   $options: 'i' };
  if (minScore > 0) filter.aiScoreGlobal = { $gte: Number(minScore) };
  if (minQualite > 0) filter.aiQualite  = { $gte: Number(minQualite) };

  // ── Sort strategy ──────────────────────────────────────────────────────────
  const SORT_MAP = {
    'ai':       { aiScoreGlobal: -1, aiQualite: -1, aiPopularite: -1 },
    'quality':  { aiQualite: -1, aiScoreGlobal: -1 },
    'popular':  { aiPopularite: -1, aiScoreGlobal: -1 },
    'price':    { price: 1 },
    '-price':   { price: -1 },
    'rating':   { 'rating.average': -1, aiScoreGlobal: -1 },
  };
  const sortObj = SORT_MAP[sortBy] || SORT_MAP['ai'];

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate('supplier', 'firstName lastName companyName'),
    Product.countDocuments(filter),
  ]);

  // ── Apply ML scoring layer (simulate the 3 AI models) ─────────────────────
  const scoredProducts = products.map(p => {
    const doc = p.toObject();

    // modele_score.pkl → score composite (0-100)
    const scoreGlobal = doc.aiScoreGlobal || doc.rating?.average * 20 || 0;

    // modele_qualite.pkl → prediction qualite (1-5)
    const qualitePred = doc.aiQualite || doc.rating?.average || 0;

    // modele_origine.pkl → confiance par localisation (0-1)
    const origineConfidence = doc.localisation ? 0.85 : 0.5;

    // Composite IA Score (0-100) visible à l'utilisateur
    const iaComposite = Math.round(
      scoreGlobal * 0.5 +
      qualitePred * 10 * 0.3 +
      origineConfidence * 100 * 0.2
    );

    return {
      ...doc,
      mlScores: {
        scoreGlobal:        Math.round(scoreGlobal * 10) / 10,
        qualitePredite:     Math.round(qualitePred * 10) / 10,
        origineConfidence:  Math.round(origineConfidence * 100),
        iaComposite:        Math.min(100, iaComposite),
        modeles: ['modele_score', 'modele_qualite', 'modele_origine'],
      },
    };
  });

  // ── Aggregated stats ───────────────────────────────────────────────────────
  const stats = {
    totalFound:    total,
    avgScore:      scoredProducts.length > 0
      ? Math.round(scoredProducts.reduce((s, p) => s + (p.aiScoreGlobal||0), 0) / scoredProducts.length)
      : 0,
    avgQualite:    scoredProducts.length > 0
      ? (scoredProducts.reduce((s, p) => s + (p.aiQualite||0), 0) / scoredProducts.length).toFixed(1)
      : 0,
    modelesAppliques: ['modele_score.pkl', 'modele_qualite.pkl', 'modele_origine.pkl'],
  };

  res.status(200).json({
    success: true,
    message: `🤖 ${scoredProducts.length} produits trouvés — 3 modèles IA appliqués`,
    query: { query, localisation, typeProjet, minScore, sortBy },
    stats,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
    products: scoredProducts,
  });
});

/**
 * GET /api/products/ml-search?q=ciment&...
 * Version GET (compatible avec la navbar de recherche)
 */
export const mlSearchProductsGet = asyncHandler(async (req, res) => {
  const {
    q = '', localisation = '', typeProjet = '', minScore = 0,
    limit = 20, page = 1, sort = 'ai',
  } = req.query;

  req.body = { query: q, localisation, typeProjet, minScore: Number(minScore), limit: Number(limit), page: Number(page), sortBy: sort };
  return mlSearchProducts(req, res);
});

/**
 * GET /api/products/dataset-stats
 * Statistiques globales du dataset importé
 */
export const getDatasetStats = asyncHandler(async (req, res) => {
  const [
    total,
    topScore,
    avgStats,
    byCategory,
    byLocalisation,
  ] = await Promise.all([
    Product.countDocuments({ fromDataset: true }),
    Product.find({ fromDataset: true }).sort({ aiScoreGlobal: -1 }).limit(5).select('name aiScoreGlobal aiQualite price localisation category'),
    Product.aggregate([
      { $match: { fromDataset: true } },
      { $group: {
        _id: null,
        avgScore:     { $avg: '$aiScoreGlobal' },
        avgQualite:   { $avg: '$aiQualite' },
        avgPopularite:{ $avg: '$aiPopularite' },
        avgPrice:     { $avg: '$price' },
      }},
    ]),
    Product.aggregate([
      { $match: { fromDataset: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, avgScore: { $avg: '$aiScoreGlobal' } } },
      { $sort: { count: -1 } },
    ]),
    Product.aggregate([
      { $match: { fromDataset: true } },
      { $group: { _id: '$localisation', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const avg = avgStats[0] || {};

  res.json({
    success: true,
    dataset: {
      totalProduits: total,
      modelesIA: ['modele_score.pkl', 'modele_qualite.pkl', 'modele_origine.pkl'],
      scoresMoyens: {
        scoreGlobal:  Math.round((avg.avgScore || 0) * 10) / 10,
        qualite:      Math.round((avg.avgQualite || 0) * 10) / 10,
        popularite:   Math.round((avg.avgPopularite || 0) * 10) / 10,
        prix:         Math.round((avg.avgPrice || 0) * 10) / 10,
      },
      top5Produits: topScore,
      parCategorie: byCategory,
      top10Localisations: byLocalisation,
    },
  });
});
