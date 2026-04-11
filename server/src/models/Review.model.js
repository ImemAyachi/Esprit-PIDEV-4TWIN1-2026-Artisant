/**
 * Modèle Review — Avis et notes sur les produits et services
 *
 * Chaque review met à jour automatiquement la note moyenne du produit/service
 *
 * MongoDB Compass :
 *   Avis positifs sur le marbre : { "product.category": "marbre", rating: { $gte: 4 } }
 *   Recommandations : { isRecommended: true }
 */
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    // Auteur de l'avis (Architecte, Ingénieur, ou Artisan)
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Un seul des deux doit être rempli (product OU service)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },
    // Pour les avis sur un artisan (service rendu)
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Note de 1 à 5
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Recommandation explicite
    isRecommended: { type: Boolean, default: false },

    // Commentaire structuré
    title: { type: String, maxlength: 100 },
    comment: { type: String, maxlength: 1500 },
    pros: [{ type: String }], // Points positifs
    cons: [{ type: String }], // Points négatifs

    // Photos jointes à l'avis
    images: [{ type: String }], // URLs Cloudinary

    // Signalement d'abus
    isVerified: { type: Boolean, default: false }, // Achat vérifié ?
    isFlagged: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false }, // Pour la modération (SuperAdmin)

    // Réponse du fournisseur ou artisan
    reply: {
      text: { type: String, maxlength: 500 },
      repliedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// Un utilisateur ne peut laisser qu'un avis par produit/artisan
reviewSchema.index({ author: 1, product: 1 }, { 
  unique: true, 
  partialFilterExpression: { product: { $exists: true, $ne: null } } 
});

reviewSchema.index({ author: 1, artisan: 1 }, { 
  unique: true, 
  partialFilterExpression: { artisan: { $exists: true, $ne: null } } 
});

/**
 * Après chaque sauvegarde d'un avis, on recalcule la note moyenne du produit
 * C'est une méthode statique appelée dans le controller
 */
reviewSchema.statics.calcAverageRating = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
        recommended: { $sum: { $cond: ['$isRecommended', 1, 0] } },
      },
    },
  ]);

  const Product = mongoose.model('Product');
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      'rating.average': Math.round(stats[0].avgRating * 10) / 10,
      'rating.count': stats[0].count,
      'rating.recommended': stats[0].recommended,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      'rating.average': 0, 'rating.count': 0, 'rating.recommended': 0,
    });
  }
};

// Hook : recalcule la moyenne après save et après delete
reviewSchema.post('save', function () {
  if (this.product) this.constructor.calcAverageRating(this.product);
});
reviewSchema.post('deleteOne', { document: true }, function () {
  if (this.product) this.constructor.calcAverageRating(this.product);
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
