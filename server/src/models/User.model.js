/**
 * Modèle User — Utilisateurs multi-rôles
 *
 * Rôles : SuperAdmin | Architecte | Ingenieur | Fournisseur | Artisan
 *
 * MongoDB Compass — requêtes utiles :
 *   Tous les artisans actifs       : { role: "Artisan", isActive: true }
 *   Professionnels non vérifiés    : { isVerified: false, role: { $ne: "SuperAdmin" } }
 *   Recherche par ville            : { "location.city": "Tunis" }
 *
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [SuperAdmin, Architecte, Ingenieur, Fournisseur, Artisan]
 *         isActive:
 *           type: boolean
 *         isVerified:
 *           type: boolean
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const locationSchema = new mongoose.Schema({
  address:  { type: String },
  city:     { type: String, index: true },
  state:    { type: String },
  country:  { type: String, default: 'Tunisie' },
  lat:      { type: Number },
  lng:      { type: Number },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    // ── Identité ──────────────────────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, 'Le prénom est obligatoire'],
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Format email invalide'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: 8,
      select: false, // Ne jamais retourner le mdp dans les requêtes
    },
    phone: { type: String, trim: true },
    avatar: { type: String }, // URL Cloudinary

    // ── Rôle & Statut ─────────────────────────────────────────────────────
    role: {
      type: String,
      enum: ['SuperAdmin', 'Architecte', 'Ingenieur', 'Fournisseur', 'Artisan'],
      required: true,
    },
    isActive:   { type: Boolean, default: true },
    // Les professionnels doivent être validés par le SuperAdmin avant de publier
    isVerified: { type: Boolean, default: false },

    // ── Localisation ──────────────────────────────────────────────────────
    location: locationSchema,

    // ── Profil Artisan ────────────────────────────────────────────────────
    // Spécifique au rôle Artisan
    craft: {
      type: String,
      // Métier de l'artisan
      enum: ['maçon', 'plombier', 'électricien', 'peintre', 'carreleur', 'menuisier', 'autre'],
    },
    experience:   { type: Number }, // Années d'expérience
    certifications: [{ type: String }], // URLs Cloudinary de diplômes/attestations

    // ── Profil Fournisseur ────────────────────────────────────────────────
    companyName:    { type: String },
    supplierType:   { type: String }, // ex: 'marbre', 'ciment', 'carrelage'
    supplierTrustScore: { type: Number, default: 80, min: 0, max: 100 }, // Score de confiance tarifaire (PriceRadar)

    // ── Profil Architecte / Ingénieur ─────────────────────────────────────
    specialization: { type: String }, // ex: 'génie civil', 'architecture d'intérieur'
    portfolio:      [{ type: String }], // URLs de projets réalisés

    // ── Notation globale ──────────────────────────────────────────────────
    // Calculée à partir des reviews reçues
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0 },
    },

    // ── Sécurité ──────────────────────────────────────────────────────────
    resetPasswordToken:   { type: String },
    resetPasswordExpire:  { type: Date },
    lastLogin:            { type: Date },
    
    // 2FA Fields
    twoFactorCode:        { type: String },
    twoFactorExpire:      { type: Date },
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt automatiquement
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Index composés pour les recherches courantes ───────────────────────────────
userSchema.index({ role: 1, isActive: 1, isVerified: 1 });
userSchema.index({ 'location.city': 1, craft: 1 }); // Recherche artisan par ville + métier
userSchema.index({ email: 1 });

// ── Virtual : nom complet ──────────────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ── Middleware pre-save : hash du mot de passe ─────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  
  // Éviter de rehacher si c'est déjà un hash bcrypt (ex: via seed)
  if (this.password && this.password.startsWith('$2')) return;
  
  this.password = await bcrypt.hash(this.password, 12);
});

// ── Méthode d'instance : vérifier le mot de passe ─────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
