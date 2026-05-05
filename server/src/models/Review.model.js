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

    // Chantier lié (feedback architecte → artisan pour un job / projet précis)
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
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

// Un avis « général » par auteur par artisan (sans chantier)
reviewSchema.index(
  { author: 1, artisan: 1 },
  {
    unique: true,
    partialFilterExpression: {
      artisan: { $exists: true, $ne: null },
      $or: [{ project: { $exists: false } }, { project: null }],
    },
  }
);

// Un feedback par auteur par artisan par chantier (job)
reviewSchema.index(
  { author: 1, artisan: 1, project: 1 },
  {
    unique: true,
    partialFilterExpression: {
      artisan: { $exists: true, $ne: null },
      project: { $exists: true, $ne: null },
    },
  }
);

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
    const humanRating = Math.round(stats[0].avgRating * 10) / 10;
    const popularite = stats[0].count;
    
    // 🧠 INTEGRATION DU MODÈLE ML (SCORE DYNAMIQUE)
    let finalScore = humanRating;
    try {
      const productDoc = await Product.findById(productId);
      const mlResponse = await fetch('http://localhost:8000/predict-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prix: productDoc.price || 0,
          qualite_humaine: humanRating,
          popularite: popularite
        })
      });
      if (mlResponse.ok) {
        const mlData = await mlResponse.json();
        if (mlData.score_ia) {
          finalScore = mlData.score_ia; // On utilise le Score IA calculé par le modèle !
          console.log(`🧠 ML Model a mis à jour le score de ${productDoc.name}: Humain=${humanRating} -> IA=${finalScore}`);
        }
      }
    } catch (err) {
      console.log("⚠️ Microservice ML injoignable, utilisation du score humain basique.", err.message);
    }

    await Product.findByIdAndUpdate(productId, {
      'rating.average': Math.round(finalScore * 10) / 10,
      'rating.count': popularite,
      'rating.recommended': stats[0].recommended,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      'rating.average': 0, 'rating.count': 0, 'rating.recommended': 0,
    });
  }
};

reviewSchema.statics.calcAverageArtisanRating = async function (artisanId) {
  const stats = await this.aggregate([
    { $match: { artisan: artisanId, isHidden: false } },
    {
      $group: {
        _id: '$artisan',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const User = mongoose.model('User');
  if (stats.length > 0) {
    await User.findByIdAndUpdate(artisanId, {
      'rating.average': Math.round(stats[0].avgRating * 10) / 10,
      'rating.count': stats[0].count,
    });
  } else {
    await User.findByIdAndUpdate(artisanId, {
      'rating.average': 0,
      'rating.count': 0,
    });
  }
};

// Hook : recalcule les moyennes produit / artisan après save et delete
reviewSchema.post('save', function () {
  if (this.product) this.constructor.calcAverageRating(this.product);
  if (this.artisan) this.constructor.calcAverageArtisanRating(this.artisan);
});
reviewSchema.post('deleteOne', { document: true }, function () {
  if (this.product) this.constructor.calcAverageRating(this.product);
  if (this.artisan) this.constructor.calcAverageArtisanRating(this.artisan);
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
