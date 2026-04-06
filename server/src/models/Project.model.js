/**
 * Modèle Project (Chantier) — Géré par Ingénieur
 *
 * Fonctionnalité clé : suivi financier par chantier pour les artisans
 * Calcul automatique bénéfice/perte
 *
 * MongoDB Compass :
 *   Chantiers en cours  : { status: "in_progress" }
 *   Chantiers rentables : { "financials.profit": { $gt: 0 } }
 */
import mongoose from 'mongoose';

// Dépense liée au chantier (achat matériaux, sous-traitance)
const expenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount:      { type: Number, required: true, min: 0 },
  category:    { type: String, enum: ['matériaux', 'main_d_oeuvre', 'outillage', 'transport', 'autre'] },
  date:        { type: Date, default: Date.now },
  receiptUrl:  { type: String }, // Photo du reçu / facture
  addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: true }); // _id:true pour pouvoir supprimer une dépense précise

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 3000 },

    // Responsable du projet : Ingénieur ou Architecte
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Artisans rattachés au chantier (plusieurs métiers)
    artisans: [{
      artisan:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role:        { type: String }, // Rôle sur ce chantier
      status:      { type: String, enum: ['invited', 'accepted', 'rejected', 'completed'], default: 'invited' },
      totalAmount: { type: Number, default: 0 }, // Montant du devis accepté
    }],

    // Localisation du chantier
    location: {
      address: { type: String },
      city:    { type: String, index: true },
    },

    // Dates
    startDate:      { type: Date },
    expectedEndDate: { type: Date },
    actualEndDate:   { type: Date },

    status: {
      type: String,
      enum: ['draft', 'open', 'in_progress', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },

    // Budget négocié avec le client
    budget: { type: Number, default: 0 },

    // ── Suivi financier ───────────────────────────────────────────────────
    // Liste des dépenses saisies par l'artisan ou le manager
    expenses: [expenseSchema],

    // Chiffres agrégés (recalculés à chaque sauvegarde)
    financials: {
      totalExpenses: { type: Number, default: 0 },
      totalRevenue:  { type: Number, default: 0 }, // Montant devis acceptés
      profit:        { type: Number, default: 0 }, // Revenue - Expenses
      profitMargin:  { type: Number, default: 0 }, // En %
    },

    // Commandes passées pour ce chantier
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    quotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quote' }],

    documents: [{
      name: { type: String },
      url:  { type: String },
      type: { type: String, enum: ['plan', 'contrat', 'permit', 'autre'] },
    }],
  },
  { timestamps: true }
);

// Recalcul des financials avant chaque sauvegarde
projectSchema.pre('save', async function () {
  if (this.expenses && this.expenses.length >= 0) {
    const total = this.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    this.financials.totalExpenses = total;
    this.financials.profit = this.financials.totalRevenue - total;
    if (this.financials.totalRevenue > 0) {
      this.financials.profitMargin = Math.round(
        (this.financials.profit / this.financials.totalRevenue) * 100
      );
    }
  }
});

projectSchema.index({ manager: 1, status: 1 });
projectSchema.index({ 'artisans.artisan': 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
