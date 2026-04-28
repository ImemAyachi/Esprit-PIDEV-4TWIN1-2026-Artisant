/**
 * Modèle Product — Catalogue produits des fournisseurs
 *
 * MongoDB Compass — requêtes utiles :
 *   Par catégorie         : { category: "marbre" }
 *   Produits dispo <500dt : { isAvailable: true, price: { $lt: 500 } }
 *   Meilleurs notés       : tri par rating.average DESC
 *
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         price:
 *           type: number
 *         supplier:
 *           type: string
 *           description: ObjectId référence vers User (Fournisseur)
 */
import mongoose from 'mongoose';

// Sous-schéma pour les spécifications techniques (fiches techniques)
const specificationSchema = new mongoose.Schema({
  key:   { type: String, required: true }, // ex: "Épaisseur"
  value: { type: String, required: true }, // ex: "2cm"
}, { _id: false });

// Sous-schéma pour les médias (images, PDFs, vidéos)
const mediaSchema = new mongoose.Schema({
  type:    { type: String, enum: ['image', 'pdf', 'video'], required: true },
  url:     { type: String, required: true }, // URL Cloudinary
  caption: { type: String },
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    // ── Infos générales ───────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Le nom du produit est obligatoire'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      maxlength: 2000,
    },
    // Catégories de matériaux de construction
    category: {
      type: String,
      required: true,
      enum: ['marbre', 'granit', 'ciment', 'sable', 'carrelage', 'brique', 'bois', 'acier', 'verre', 'peinture', 'plomberie', 'électricité', 'autre'],
    },
    subCategory: { type: String },

    // ── Fournisseur (référence ObjectId) ──────────────────────────────────
    // Relation Many-to-One avec User (rôle Fournisseur)
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Prix & Stock ──────────────────────────────────────────────────────
    price: {
      type: Number,
      required: [true, 'Le prix est obligatoire'],
      min: [0, 'Le prix doit être positif'],
    },
    priceUnit: {
      type: String,
      default: 'TND', // Dinar Tunisien
      enum: ['TND', 'EUR', 'USD'],
    },
    unit: {
      type: String,
      default: 'm²',
      enum: ['m²', 'm³', 'kg', 'tonne', 'pièce', 'mètre', 'litre', 'sac'],
    },
    stock: {
      quantity: { type: Number, default: 0 },
      minOrderQty: { type: Number, default: 1 },
      alertThreshold: { type: Number, default: 10 }, // Alerte si stock < seuil
    },
    isAvailable: { type: Boolean, default: true, index: true },

    // ── Fiche technique ───────────────────────────────────────────────────
    specifications: [specificationSchema], // Tableau clé-valeur
    useCases: [{ type: String }],          // Cas d'usage : ex: "Revêtement de sol"

    // ── Médias ────────────────────────────────────────────────────────────
    media: [mediaSchema], // Images, PDFs techniques, vidéos

    // ── Notation ──────────────────────────────────────────────────────────
    // Calculée automatiquement à partir des Reviews
    rating: {
      average:    { type: Number, default: 0, min: 0, max: 5 },
      count:      { type: Number, default: 0 },
      recommended: { type: Number, default: 0 }, // Nombre de "je recommande"
    },

    // ── PriceRadar 2.0 Integration ─────────────────────────────────────────
    priceHistory: [{
      price: { type: Number, required: true },
      date: { type: Date, default: Date.now }
    }],
    priceRadar: {
      status: { type: String, enum: ['normal', 'high', 'low'], default: 'normal' },
      marketAvg: { type: Number },
      deviationPercent: { type: Number },
      hasAcceptedHighPrice: { type: Boolean, default: false }, // Si le fournisseur assume le prix élevé
      opportunityScore: { type: Number, default: 0 },         // Pour la page "Produits Chance"
    },

    // ── SEO / Recherche ───────────────────────────────────────────────────
    tags: [{ type: String }], // ex: ['résistant', 'luxe', 'importé']
    views: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ── Index texte pour la recherche full-text ────────────────────────────────────
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isAvailable: 1, 'rating.average': -1 });
productSchema.index({ price: 1 });
productSchema.index({ supplier: 1 });

// ── Virtual : URL de l'image principale ───────────────────────────────────────
productSchema.virtual('mainImage').get(function () {
  const img = this.media?.find((m) => m.type === 'image');
  return img ? img.url : null;
});

const Product = mongoose.model('Product', productSchema);
export default Product;
