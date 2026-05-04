/**
 * seedFromCSV.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Importe les 1201 produits du dataset construction_showroom_tunisia.csv
 * dans MongoDB avec les scores IA (score_global, qualite, popularite).
 *
 * Usage : node src/scripts/seedFromCSV.js
 *         node src/scripts/seedFromCSV.js --clear   (efface puis re-seed)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── .env ──────────────────────────────────────────────────────────────────────
const envPaths = [
  path.join(__dirname, '../../.env'),
  path.join(process.cwd(), '.env'),
];
for (const p of envPaths) {
  const r = dotenv.config({ path: p });
  if (!r.error) { console.log(`📄 .env chargé : ${p}`); break; }
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌ MONGO_URI manquant'); process.exit(1); }

const CSV_PATH = path.join(__dirname, '../../..', 'modele-produit', 'construction_showroom_tunisia.csv');

// ── Schémas inline ────────────────────────────────────────────────────────────
const specSchema = new mongoose.Schema({ key: String, value: String }, { _id: false });
const mediaSchema = new mongoose.Schema(
  { type: { type: String, enum: ['image','pdf','video'] }, url: String, caption: String },
  { _id: false }
);

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  category: {
    type: String, required: true,
    enum: ['marbre','granit','ciment','sable','carrelage','brique','bois','acier',
           'verre','peinture','plomberie','électricité','isolation','quincaillerie',
           'maconnerie','etancheite','menuiserie','revetement','autre'],
  },
  subCategory:  String,
  supplier:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price:        { type: Number, required: true, min: 0 },
  priceUnit:    { type: String, default: 'TND' },
  unit:         { type: String, default: 'pièce' },
  stock:        { quantity: { type: Number, default: 0 }, minOrderQty: { type: Number, default: 1 }, alertThreshold: { type: Number, default: 10 } },
  isAvailable:  { type: Boolean, default: true },
  specifications: [specSchema],
  useCases:     [String],
  media:        [mediaSchema],
  rating:       { average: { type: Number, default: 0 }, count: { type: Number, default: 0 }, recommended: { type: Number, default: 0 } },
  priceHistory: [{ price: Number, date: { type: Date, default: Date.now } }],
  priceRadar: {
    status:           { type: String, enum: ['normal','high','low'], default: 'normal' },
    marketAvg:        Number,
    deviationPercent: Number,
    opportunityScore: { type: Number, default: 0 },
  },
  tags:    [String],
  views:   { type: Number, default: 0 },
  // ── AI / ML fields from the dataset ─────────────────────────────────────────
  aiScoreGlobal: { type: Number, default: 0 },    // score_global  (0-100)
  aiQualite:     { type: Number, default: 0 },    // qualite       (1-5)
  aiPopularite:  { type: Number, default: 0 },    // popularite    (0-100)
  localisation:  String,
  typeProjet:    String,
  surfaceM2:     Number,
  budget:        Number,
  marque:        String,
  quantite:      Number,
  prixTotal:     Number,
  fromDataset:   { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true } });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isAvailable: 1, 'rating.average': -1 });
productSchema.index({ aiScoreGlobal: -1 });
productSchema.index({ fromDataset: 1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const userSchema = new mongoose.Schema({ email: String }, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

// ── Category mapping CSV → Product model enum ─────────────────────────────────
const CAT_MAP = {
  maconnerie:   'maconnerie',
  quincaillerie:'quincaillerie',
  plomberie:    'plomberie',
  etancheite:   'etancheite',
  peinture:     'peinture',
  isolation:    'isolation',
  electricite:  'électricité',
  menuiserie:   'menuiserie',
  revetement:   'revetement',
};

// ── Category images (Unsplash keywords) ──────────────────────────────────────
const CAT_IMAGES = {
  maconnerie:   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600',
  quincaillerie:'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600',
  plomberie:    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600',
  etancheite:   'https://images.unsplash.com/photo-1590578819279-cdab8b670b17?w=600',
  peinture:     'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600',
  isolation:    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600',
  electricite:  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
  menuiserie:   'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600',
  revetement:   'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=600',
};

// ── Parse CSV ─────────────────────────────────────────────────────────────────
async function parseCSV(filePath) {
  const rows = [];
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  let headers = null;

  for await (const line of rl) {
    if (!headers) { headers = line.split(','); continue; }
    const vals = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h.trim()] = vals[i]?.trim(); });
    rows.push(row);
  }
  return rows;
}

// ── Map CSV row → Product document ────────────────────────────────────────────
function mapRow(row, supplierId) {
  const cat = CAT_MAP[row.categorie_produit] || 'autre';
  const qualite   = Number(row.qualite)      || 0;
  const popularite= Number(row.popularite)   || 0;
  const score     = Number(row.score_global) || 0;
  const prix      = Number(row.prix_unitaire)|| 0;
  const quantite  = Number(row.quantite)     || 0;
  const prixTotal = Number(row.prix_total)   || 0;
  const surface   = Number(row.surface_m2)   || 0;
  const budget    = Number(row.budget)       || 0;

  // Rating: map qualite(1-5) → rating.average, popularite(0-100) → count
  const ratingAvg = Math.min(5, Math.max(0, qualite));
  const ratingCount = Math.round(popularite * 3); // simulate review count

  // PriceRadar: derive from score
  let priceStatus = 'normal';
  if (score >= 95) priceStatus = 'low';   // great deal
  else if (score < 50) priceStatus = 'high'; // expensive

  const name = `${row.type_produit} ${row.marque} – ${row.localisation}`;
  const description = `Produit de type "${row.type_produit}" (${row.categorie_produit}) `
    + `fourni par ${row.marque}. Qualité ${qualite}/5, popularité ${popularite}/100. `
    + `Utilisé pour des projets de type "${row.type_projet}" en Tunisie (${row.localisation}). `
    + `Surface recommandée: ${surface} m², budget de réference: ${budget} DT.`;

  return {
    name:        name.substring(0, 199),
    description: description.substring(0, 1999),
    category:    cat,
    subCategory: row.type_produit,
    supplier:    supplierId,
    price:       prix,
    priceUnit:   'TND',
    unit:        'pièce',
    stock: {
      quantity:       quantite,
      minOrderQty:    1,
      alertThreshold: Math.max(5, Math.round(quantite * 0.05)),
    },
    isAvailable: true,
    specifications: [
      { key: 'Qualité IA',    value: `${qualite}/5` },
      { key: 'Popularité',    value: `${popularite}/100` },
      { key: 'Score Global IA', value: `${score}/100` },
      { key: 'Marque',        value: row.marque },
      { key: 'Type de projet', value: row.type_projet },
      { key: 'Localisation', value: row.localisation },
      { key: 'Surface cible', value: `${surface} m²` },
      { key: 'Quantité',     value: `${quantite} pièce(s)` },
      { key: 'Prix total estimé', value: `${prixTotal} DT` },
    ],
    useCases: [
      `Projet ${row.type_projet}`,
      `${row.categorie_produit.charAt(0).toUpperCase()}${row.categorie_produit.slice(1)}`,
      `Chantier ${row.localisation}`,
    ],
    media: [{
      type:    'image',
      url:     CAT_IMAGES[row.categorie_produit] || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600',
      caption: `${row.type_produit} – ${row.marque}`,
    }],
    rating: {
      average:     ratingAvg,
      count:       ratingCount,
      recommended: Math.round(ratingCount * (qualite / 5)),
    },
    priceHistory: [{ price: prix, date: new Date() }],
    priceRadar: {
      status:           priceStatus,
      marketAvg:        prix * 1.1,
      deviationPercent: priceStatus === 'low' ? -10 : priceStatus === 'high' ? 20 : 0,
      opportunityScore: priceStatus === 'low' ? score : 0,
    },
    tags: [row.type_produit, row.categorie_produit, row.marque, row.localisation, row.type_projet].filter(Boolean),
    views: Math.round(popularite * 50),

    // AI/ML fields
    aiScoreGlobal: score,
    aiQualite:     qualite,
    aiPopularite:  popularite,
    localisation:  row.localisation,
    typeProjet:    row.type_projet,
    surfaceM2:     surface,
    budget:        budget,
    marque:        row.marque,
    quantite:      quantite,
    prixTotal:     prixTotal,
    fromDataset:   true,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  const clearFirst = process.argv.includes('--clear');

  console.log('🔌 Connexion à MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connecté\n');

  // Find system supplier (or first available)
  const SUPPLIER_EMAIL = 'marbre@artisanet.com';
  let supplier = await User.findOne({ email: SUPPLIER_EMAIL }).lean();

  if (!supplier) {
    // Fallback: any Fournisseur or first user
    supplier = await User.findOne({ role: 'Fournisseur' }).lean();
  }
  if (!supplier) {
    supplier = await User.findOne({}).lean();
  }
  if (!supplier) {
    console.error('❌ Aucun utilisateur trouvé dans la base. Créez d\'abord un compte fournisseur.');
    process.exit(1);
  }
  console.log(`✅ Fournisseur: ${supplier.email || supplier._id}`);
  const supplierId = supplier._id;

  if (clearFirst) {
    const del = await Product.deleteMany({ fromDataset: true });
    console.log(`🗑️  ${del.deletedCount} anciens produits dataset supprimés`);
  } else {
    const existing = await Product.countDocuments({ fromDataset: true });
    if (existing > 0) {
      console.log(`ℹ️  ${existing} produits dataset déjà présents. Utilisez --clear pour réimporter.`);
      await mongoose.disconnect();
      return;
    }
  }

  console.log(`📂 Lecture CSV: ${CSV_PATH}`);
  const rows = await parseCSV(CSV_PATH);
  console.log(`📊 ${rows.length} lignes lues\n`);

  // Batch insert (500 per batch)
  const BATCH = 500;
  let total = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH).map(r => mapRow(r, supplierId));
    await Product.insertMany(batch, { ordered: false });
    total += batch.length;
    console.log(`  ✅ Batch ${Math.ceil(i/BATCH)+1}: ${total}/${rows.length} produits insérés`);
  }

  console.log(`\n🎉 ${total} produits du dataset importés avec succès !`);
  console.log('   Les scores IA (score_global, qualite, popularite) sont intégrés dans chaque produit.');

  await mongoose.disconnect();
  console.log('🔌 Déconnecté');
  process.exit(0);
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });
