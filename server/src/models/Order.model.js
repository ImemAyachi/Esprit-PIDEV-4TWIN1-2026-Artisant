/**
 * Modèle Order — Commandes de produits
 *
 * Un artisan ou architecte peut commander des produits fournisseurs
 *
 * MongoDB Compass :
 *   Commandes livrées : { status: "delivered" }
 *   Commandes par acheteur : { buyer: ObjectId("...") }
 */
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:  { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  total:     { type: Number },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    // Acheteur (Artisan ou Architecte/Ingénieur)
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Fournisseur (déduit du produit, dénormalisé pour perf)
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, default: 0 },

    // Adresse de livraison
    deliveryAddress: {
      address: { type: String, required: true },
      city:    { type: String, required: true },
    },
    deliveryNote: { type: String }, // Instructions spéciales

    // Statut de la commande
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },

    // Suivi de livraison
    trackingInfo: {
      code:             { type: String },
      estimatedDate:    { type: Date },
      deliveredAt:      { type: Date },
    },

    // Lien avec un chantier (pour suivi financier artisan)
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
  },
  { timestamps: true }
);

// Calcul auto du total avant sauvegarde
orderSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    this.items.forEach((item) => (item.total = item.quantity * item.unitPrice));
    this.totalAmount = this.items.reduce((sum, item) => sum + (item.total || 0), 0);
  }
  next();
});

orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ supplier: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
