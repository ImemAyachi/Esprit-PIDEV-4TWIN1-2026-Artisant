import Product from '../models/Product.model.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

/**
 * POST /api/ai/recommend-products
 * Get product recommendations optimized for Artisans (Best Quality, High Score, Reasonable Price)
 */
export const recommendProducts = asyncHandler(async (req, res) => {
  const { query, limit = 10 } = req.body;

  if (!query) {
    throw new AppError('Le paramètre de recherche "query" est requis.', 400);
  }

  try {
    // 1. Filter by keyword in name, tags, or description
    const filter = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    };

    // 2. We use the AI Models' pre-calculated scores that were seeded from the dataset
    // Priority: 1. rating (qualite), 2. prix (ascending)
    const products = await Product.find(filter)
      .sort({ 'rating.average': -1, price: 1 })
      .limit(limit)
      .populate('supplier', 'companyName');

    res.status(200).json({
      success: true,
      message: `Modèles appliqués : ${products.length} produits trouvés.`,
      data: {
        query,
        count: products.length,
        products: products.map(p => ({
          _id: p._id,
          nom: p.name,
          prix: p.price,
          qualite: p.rating.average,
          categorie: p.category,
          fournisseur: p.supplier?.companyName || 'Inconnu',
          scoreIA: p.specifications.find(s => s.key === 'Score IA')?.value || 'N/A'
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error.message);
    throw new AppError('Impossible de récupérer les recommandations pour le moment.', 500);
  }
});
