/**
 * Product Controller — CRUD catalogue produits
 *
 * GET    /api/products            — Catalogue public avec filtres
 * GET    /api/products/:id        — Détail produit
 * POST   /api/products            — Créer un produit (Fournisseur)
 * PUT    /api/products/:id        — Modifier (Fournisseur propriétaire)
 * DELETE /api/products/:id        — Supprimer (Fournisseur ou Admin)
 * GET    /api/products/top/:cat   — Top produits par catégorie
 */
import Product from '../models/Product.model.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

export const getProducts = asyncHandler(async (req, res) => {
  const {
    category, minPrice, maxPrice, search,
    sort = '-createdAt', page = 1, limit = 12,
    supplier, isAvailable = 'true',
  } = req.query;

  const filter = {};
  if (isAvailable === 'true') filter.isAvailable = true;
  if (category)  filter.category = category;
  if (supplier)  filter.supplier = supplier;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) {
    filter.$text = { $search: search }; // Utilise l'index texte
  }

  // Tri : -createdAt, -rating.average, price, -price
  const sortMap = {
    '-rating':   { 'rating.average': -1 },
    'price':     { price: 1 },
    '-price':    { price: -1 },
    '-createdAt':{ createdAt: -1 },
  };
  const sortObj = sortMap[sort] || { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('supplier', 'firstName lastName companyName avatar location')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } }, // Incrémenter le compteur de vues
    { new: true }
  ).populate('supplier', 'firstName lastName companyName avatar location rating');

  if (!product) throw new AppError('Produit introuvable', 404);
  res.json({ success: true, product });
});

export const createProduct = asyncHandler(async (req, res) => {
  // Traiter les médias uploadés (Multer multipart) ou pré-uploadés (JSON body)
  let media = [];
  if (req.files && req.files.length > 0) {
    // Cas multipart/form-data : fichiers envoyés directement
    media = req.files.map((f) => ({
      url:  f.path,
      type: f.mimetype.startsWith('video/') ? 'video'
           : f.mimetype === 'application/pdf' ? 'pdf'
           : 'image',
    }));
  } else if (req.body.media && Array.isArray(req.body.media) && req.body.media.length > 0) {
    // Cas JSON : URLs pré-uploadées via /uploads/multiple, envoyées en JSON
    media = req.body.media;
  }

  // Désérialiser les champs JSON envoyés en FormData
  let { specifications, useCases, tags } = req.body;
  if (typeof specifications === 'string') specifications = JSON.parse(specifications);
  if (typeof useCases      === 'string') useCases      = JSON.parse(useCases);
  if (typeof tags          === 'string') tags          = JSON.parse(tags);

  const product = await Product.create({
    ...req.body,
    supplier: req.user._id,
    media,
    specifications,
    useCases,
    tags,
    priceHistory: [{ price: req.body.price, date: new Date() }]
  });

  // Emit Socket alert for lucky deals
  if (product.priceRadar?.status === 'low') {
    const io = req.app.get('io');
    io.emit('new_lucky_deal', {
        id: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        deviation: product.priceRadar.deviationPercent
    });
  }

  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Produit introuvable', 404);

  // Seul le fournisseur propriétaire ou le SuperAdmin peut modifier
  if (!product.supplier.equals(req.user._id) && req.user.role !== 'SuperAdmin') {
    throw new AppError('Non autorisé', 403);
  }

  // Update price history if price changed
  if (req.body.price && Number(req.body.price) !== product.price) {
    req.body.$push = { priceHistory: { price: Number(req.body.price), date: new Date() } };
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  res.json({ success: true, product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Produit introuvable', 404);

  if (!product.supplier.equals(req.user._id) && req.user.role !== 'SuperAdmin') {
    throw new AppError('Non autorisé', 403);
  }

  await product.deleteOne();
  res.json({ success: true, message: 'Produit supprimé' });
});

// Top 5 produits par catégorie (meilleure note)
export const getTopByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const products = await Product.find({ category, isAvailable: true })
    .sort({ 'rating.average': -1, 'rating.count': -1 })
    .limit(5)
    .populate('supplier', 'firstName lastName companyName');
  res.json({ success: true, products });
});

// Mes produits (pour le fournisseur connecté)
export const getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ supplier: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, products, count: products.length });
});

// Produits Chance (Opportunités)
export const getLuckyDeals = asyncHandler(async (req, res) => {
  const products = await Product.find({ 'priceRadar.status': 'low', isAvailable: true })
    .sort({ 'priceRadar.opportunityScore': -1, 'priceRadar.deviationPercent': 1 })
    .populate('supplier', 'firstName lastName companyName avatar location');
    
  res.json({ success: true, products, count: products.length });
});
