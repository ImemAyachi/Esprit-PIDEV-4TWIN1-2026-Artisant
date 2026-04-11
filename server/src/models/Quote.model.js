/**
 * Modèle Quote — Devis entre Architecte/Ingénieur et Artisan
 *
 * Flux : Architecte crée une demande → Artisan soumet un devis → Architecte accepte/refuse
 *
 * MongoDB Compass — requêtes utiles :
 *   Devis en attente pour un artisan : { artisan: ObjectId("..."), status: "pending" }
 *   Devis acceptés ce mois           : { status: "accepted", createdAt: { $gte: ISODate("2024-01-01") } }
 */
import mongoose from 'mongoose';

// Ligne de devis détaillée (matériaux + main d'œuvre)
const quoteItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity:    { type: Number, required: true, min: 0 },
  unit:        { type: String, default: 'unité' },
  unitPrice:   { type: Number, required: true, min: 0 },
  total:       { type: Number }, // Calculé : quantity * unitPrice
}, { _id: false });

// Fichier joint au devis (PDF, images de chantier)
const attachmentSchema = new mongoose.Schema({
  name: { type: String },
  url:  { type: String, required: true },
  type: { type: String, enum: ['pdf', 'image', 'doc'] },
}, { _id: false });

const quoteSchema = new mongoose.Schema(
  {
    // ── Identité ──────────────────────────────────────────────────────────
    quoteNumber: {
      type:     String,
      unique:   true,
      sparse:   true, // Permet d'éviter l'erreur d'index unique sur plusieurs 'null'
      index:    true,
    },

    // ── Participants ──────────────────────────────────────────────────────
    // Demandeur : Architecte ou Ingénieur
    requester: {

      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Artisan sollicité
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ── Projet associé (optionnel) ────────────────────────────────────────
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },

    // ── Description de la demande ─────────────────────────────────────────
    title:       { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 3000 },
    location:    { type: String }, // Adresse du chantier

    // Deadline souhaitée par le demandeur
    desiredDeadline: { type: Date },

    // Pièces jointes envoyées par le demandeur (plans, photos)
    requesterAttachments: [attachmentSchema],

    // ── Réponse de l'artisan ──────────────────────────────────────────────
    items: [quoteItemSchema], // Détail du devis ligne par ligne
    totalAmount: { type: Number, default: 0 },
    proposedDeadline: { type: Date },
    notes: { type: String, maxlength: 1000 }, // Note artisan
    artisanAttachments: [attachmentSchema],   // Fichiers envoyés par l'artisan

    // ── Statut du devis ───────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['open', 'pending', 'accepted', 'refused', 'cancelled', 'completed'],
      default: 'open',
      index: true,
    },

    // ── Historique des statuts ────────────────────────────────────────────
    statusHistory: [{
      status:    { type: String },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      changedAt: { type: Date, default: Date.now },
      reason:    { type: String },
    }],

    // ── Paiement ──────────────────────────────────────────────────────────
    isPaid:    { type: Boolean, default: false },
    paidAt:    { type: Date },
    invoiceUrl: { type: String }, // URL Cloudinary de la facture PDF
  },
  { timestamps: true }
);

// ── Middleware pre-save : calcul automatique du total ─────────────────────────
quoteSchema.pre('save', async function () {
  // Générer un numéro de devis unique si absent
  if (!this.quoteNumber) {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.quoteNumber = `BM-QT-${year}-${random}`;
  }

  if (this.items && this.items.length > 0) {

    this.items.forEach((item) => {
      item.total = item.quantity * item.unitPrice;
    });
    this.totalAmount = this.items.reduce((sum, item) => sum + (item.total || 0), 0);
  }
});

quoteSchema.index({ requester: 1, status: 1 });
quoteSchema.index({ artisan: 1, status: 1 });
quoteSchema.index({ project: 1 });

const Quote = mongoose.model('Quote', quoteSchema);
export default Quote;
