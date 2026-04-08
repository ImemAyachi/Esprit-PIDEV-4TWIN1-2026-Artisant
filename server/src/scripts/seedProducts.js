/**
 * seedProducts.js
 * ---------------
 * Insère 10 produits de matériaux de construction dans MongoDB.
 * Usage : node src/scripts/seedProducts.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Essaye plusieurs chemins possibles pour .env
const envPaths = [
  path.join(__dirname, '../../.env'),   // depuis src/scripts/ → server/.env
  path.join(__dirname, '../../../.env'), // fallback
  path.join(process.cwd(), '.env'),      // depuis le répertoire courant
];
for (const p of envPaths) {
  const result = dotenv.config({ path: p });
  if (!result.error) { console.log(`📄 .env chargé depuis : ${p}`); break; }
}

// ── Connexion MongoDB ──────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI manquant dans .env');
  process.exit(1);
}

// ── Schémas inline (évite les imports circulaires) ────────────────────────────
const specificationSchema = new mongoose.Schema({
  key:   { type: String, required: true },
  value: { type: String, required: true },
}, { _id: false });

const mediaSchema = new mongoose.Schema({
  type:    { type: String, enum: ['image', 'pdf', 'video'], required: true },
  url:     { type: String, required: true },
  caption: { type: String },
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    category: {
      type: String,
      required: true,
      enum: ['marbre', 'granit', 'ciment', 'sable', 'carrelage', 'brique', 'bois', 'acier', 'verre', 'peinture', 'plomberie', 'électricité', 'autre'],
    },
    subCategory:    { type: String },
    supplier:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price:          { type: Number, required: true, min: 0 },
    priceUnit:      { type: String, default: 'TND', enum: ['TND', 'EUR', 'USD'] },
    unit:           { type: String, default: 'm²', enum: ['m²', 'm³', 'kg', 'tonne', 'pièce', 'mètre', 'litre', 'sac'] },
    stock: {
      quantity:       { type: Number, default: 0 },
      minOrderQty:    { type: Number, default: 1 },
      alertThreshold: { type: Number, default: 10 },
    },
    isAvailable:    { type: Boolean, default: true },
    specifications: [specificationSchema],
    useCases:       [{ type: String }],
    media:          [mediaSchema],
    rating: {
      average:     { type: Number, default: 0, min: 0, max: 5 },
      count:       { type: Number, default: 0 },
      recommended: { type: Number, default: 0 },
    },
    tags:  [{ type: String }],
    views: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// Utilise le même nom de collection que Product.model.js
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// ── Schéma User minimal pour rechercher le fournisseur ────────────────────────
const userSchema = new mongoose.Schema({ email: String }, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

// ── Données des 10 produits (supplier sera injecté dynamiquement) ────────────
const buildProducts = (supplierId) => ([
  // 1. Marbre Blanc Carrara
  {
    name: 'Marbre Blanc Carrara Premium',
    description:
      'Marbre naturel blanc de haute qualité extrait des carrières de Carrara en Italie. Idéal pour les revêtements de sol, escaliers et comptoirs haut de gamme. Surface polie avec veines grises délicates.',
    category: 'marbre',
    subCategory: 'marbre importé',
    supplier: supplierId,
    price: 185.00,
    priceUnit: 'TND',
    unit: 'm²',
    stock: { quantity: 320, minOrderQty: 5, alertThreshold: 30 },
    isAvailable: true,
    specifications: [
      { key: 'Épaisseur', value: '2 cm' },
      { key: 'Finition', value: 'Poli brillant' },
      { key: 'Résistance à la compression', value: '131 MPa' },
      { key: 'Absorption eau', value: '< 0.2%' },
      { key: 'Dimensions standard', value: '60x60 cm' },
      { key: 'Origine', value: 'Italie – Carrara' },
    ],
    useCases: ['Revêtement de sol intérieur', 'Escaliers', 'Comptoirs de cuisine', 'Habillage de murs', 'Salles de bain luxueuses'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800',
        caption: 'Marbre Blanc Carrara – vue de dessus',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=800',
        caption: 'Application en revêtement de sol',
      },
    ],
    rating: { average: 4.8, count: 127, recommended: 119 },
    tags: ['marbre', 'blanc', 'luxe', 'importé', 'polí', 'Carrara'],
    views: 2340,
  },

  // 2. Granit Noir Absolu
  {
    name: 'Granit Noir Absolu Zimbabwe',
    description:
      'Granit noir intense provenant du Zimbabwe, reconnu pour sa teinte profonde et uniforme. Très résistant aux rayures et à la chaleur. Parfait pour cuisines, salles de bains et espaces commerciaux.',
    category: 'granit',
    subCategory: 'granit importé',
    supplier: supplierId,
    price: 210.00,
    priceUnit: 'TND',
    unit: 'm²',
    stock: { quantity: 180, minOrderQty: 3, alertThreshold: 20 },
    isAvailable: true,
    specifications: [
      { key: 'Épaisseur', value: '3 cm' },
      { key: 'Finition', value: 'Poli miroir' },
      { key: 'Dureté Mohs', value: '6-7' },
      { key: 'Résistance thermique', value: 'jusqu\'à 300°C' },
      { key: 'Dimensions', value: '60x60 cm / Sur mesure' },
      { key: 'Origine', value: 'Zimbabwe' },
    ],
    useCases: ['Plans de travail cuisine', 'Revêtement mural', 'Façades extérieures', 'Tables de conférence', 'Comptoirs de réception'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        caption: 'Granit Noir Absolu – surface polie',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        caption: 'Plan de travail en granit noir',
      },
    ],
    rating: { average: 4.9, count: 89, recommended: 87 },
    tags: ['granit', 'noir', 'résistant', 'cuisine', 'luxe', 'premium'],
    views: 1890,
  },

  // 3. Ciment Portland
  {
    name: 'Ciment Portland CEM I 42.5 N',
    description:
      'Ciment Portland ordinaire haute résistance, certifié EN 197-1. Convient pour tous travaux de béton armé, fondations, dallages et maçonnerie. Conditionnement en sacs de 50 kg ou livraison en vrac.',
    category: 'ciment',
    subCategory: 'ciment gris',
    supplier: supplierId,
    price: 28.50,
    priceUnit: 'TND',
    unit: 'sac',
    stock: { quantity: 5000, minOrderQty: 50, alertThreshold: 200 },
    isAvailable: true,
    specifications: [
      { key: 'Classe de résistance', value: '42.5 N' },
      { key: 'Poids du sac', value: '50 kg' },
      { key: 'Résistance à 28 jours', value: '≥ 42.5 MPa' },
      { key: 'Temps de prise initial', value: '≥ 60 min' },
      { key: 'Teneur en clinker', value: '≥ 95%' },
      { key: 'Certification', value: 'NF EN 197-1' },
    ],
    useCases: ['Béton armé', 'Fondations', 'Dallages industriels', 'Maçonnerie', 'Préfabrication'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
        caption: 'Sacs de ciment Portland 50kg',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1590578819279-cdab8b670b17?w=800',
        caption: 'Chantier béton armé',
      },
    ],
    rating: { average: 4.5, count: 312, recommended: 289 },
    tags: ['ciment', 'béton', 'construction', 'résistant', 'fondation', 'CEM I'],
    views: 4560,
  },

  // 4. Carrelage Grès Porcelainé
  {
    name: 'Carrelage Grès Porcelainé Effet Bois Chêne',
    description:
      'Carrelage grès porcelainé rectifié imitant le parquet chêne avec une texture réaliste. Résistant à l\'humidité, aux taches et aux passages intensifs. Idéal pour intérieur et extérieur couvert.',
    category: 'carrelage',
    subCategory: 'grès porcelainé',
    supplier: supplierId,
    price: 55.00,
    priceUnit: 'TND',
    unit: 'm²',
    stock: { quantity: 1200, minOrderQty: 10, alertThreshold: 50 },
    isAvailable: true,
    specifications: [
      { key: 'Format', value: '20x120 cm' },
      { key: 'Épaisseur', value: '9 mm' },
      { key: 'Finition', value: 'Mate anti-dérapante R10' },
      { key: 'Absorption eau', value: '< 0.5%' },
      { key: 'Classe d\'usure', value: 'PEI 4' },
      { key: 'Résistance gel', value: 'Oui' },
      { key: 'Couleur', value: 'Chêne miel naturel' },
    ],
    useCases: ['Sol salon', 'Terrasse couverte', 'Couloir', 'Hall d\'entrée', 'Bureau'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=800',
        caption: 'Carrelage effet bois chêne posé',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
        caption: 'Rendu salon avec carrelage bois',
      },
    ],
    rating: { average: 4.6, count: 203, recommended: 191 },
    tags: ['carrelage', 'grès', 'effet bois', 'chêne', 'anti-dérapant', 'rectifié'],
    views: 3210,
  },

  // 5. Brique Rouge Creuse
  {
    name: 'Brique Rouge Creuse 8 Trous – Format Standard',
    description:
      'Brique rouge creuse à 8 trous fabriquée en argile cuite, idéale pour la construction de cloisons et murs porteurs non exposés aux intempéries. Bonne isolation thermique et acoustique.',
    category: 'brique',
    subCategory: 'brique creuse',
    supplier: supplierId,
    price: 1.20,
    priceUnit: 'TND',
    unit: 'pièce',
    stock: { quantity: 25000, minOrderQty: 500, alertThreshold: 1000 },
    isAvailable: true,
    specifications: [
      { key: 'Dimensions', value: '20x10x5 cm' },
      { key: 'Nombre de trous', value: '8' },
      { key: 'Poids unitaire', value: '1.8 kg' },
      { key: 'Résistance à la compression', value: '≥ 7.5 N/mm²' },
      { key: 'Résistance au gel', value: 'Classe F0' },
      { key: 'Conductivité thermique λ', value: '0.40 W/mK' },
    ],
    useCases: ['Cloisons intérieures', 'Murs porteurs', 'Remplissage de façades', 'Soubassements'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1564182842519-8a3b2af3e228?w=800',
        caption: 'Briques rouges creuses empilées',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=800',
        caption: 'Mur en construction avec briques rouges',
      },
    ],
    rating: { average: 4.3, count: 445, recommended: 412 },
    tags: ['brique', 'rouge', 'argile', 'maçonnerie', 'cloison', 'isolation'],
    views: 5670,
  },

  // 6. Bois Lamellé-Collé
  {
    name: 'Poutre Bois Lamellé-Collé Douglas 6m',
    description:
      'Poutre en bois lamellé-collé de Douglas, traitement classe 3 pour usage intérieur et extérieur couvert. Hautement résistante aux charges, elle convient pour les charpentes, pergolas et planchers bois.',
    category: 'bois',
    subCategory: 'bois lamellé-collé',
    supplier: supplierId,
    price: 340.00,
    priceUnit: 'TND',
    unit: 'pièce',
    stock: { quantity: 85, minOrderQty: 1, alertThreshold: 10 },
    isAvailable: true,
    specifications: [
      { key: 'Section', value: '15x20 cm' },
      { key: 'Longueur', value: '6 m' },
      { key: 'Essence', value: 'Douglas (Pseudotsuga menziesii)' },
      { key: 'Classe de résistance', value: 'GL24h' },
      { key: 'Traitement', value: 'Classe 3 – imprégné autoclave' },
      { key: 'Humidité', value: '≤ 12%' },
      { key: 'Certification', value: 'CE + PEFC' },
    ],
    useCases: ['Charpente traditionnelle', 'Pergola', 'Plancher bois', 'Ossature bois', 'Maison à ossature bois'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800',
        caption: 'Poutres lamellé-collé en charpente',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
        caption: 'Charpente bois lamellé-collé Douglas',
      },
    ],
    rating: { average: 4.7, count: 67, recommended: 64 },
    tags: ['bois', 'lamellé-collé', 'Douglas', 'charpente', 'structure', 'PEFC'],
    views: 1230,
  },

  // 7. Acier Rond à Béton
  {
    name: 'Acier Rond à Béton HA 12mm – Barre 12m',
    description:
      'Acier haute adhérence (HA) de diamètre 12mm en barres de 12m, conforme à la norme NF A 35-080. Utilisé pour l\'armature des structures en béton armé : poteaux, poutres, dalles et semelles.',
    category: 'acier',
    subCategory: 'acier béton',
    supplier: supplierId,
    price: 48.50,
    priceUnit: 'TND',
    unit: 'pièce',
    stock: { quantity: 3500, minOrderQty: 20, alertThreshold: 200 },
    isAvailable: true,
    specifications: [
      { key: 'Diamètre', value: '12 mm (HA12)' },
      { key: 'Longueur', value: '12 m' },
      { key: 'Nuance acier', value: 'B500B' },
      { key: 'Limite élastique Re', value: '≥ 500 MPa' },
      { key: 'Résistance à la traction', value: '≥ 540 MPa' },
      { key: 'Poids linéique', value: '0.888 kg/m' },
      { key: 'Norme', value: 'NF A 35-080 / EN 10080' },
    ],
    useCases: ['Béton armé', 'Poteaux et poutres', 'Dalles', 'Fondations', 'Murs de soutènement'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
        caption: 'Barres d\'acier HA 12mm sur chantier',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1590578819279-cdab8b670b17?w=800',
        caption: 'Ferraillage béton armé',
      },
    ],
    rating: { average: 4.6, count: 378, recommended: 356 },
    tags: ['acier', 'ferraillage', 'béton armé', 'HA12', 'B500B', 'structure'],
    views: 6780,
  },

  // 8. Peinture Façade
  {
    name: 'Peinture Façade Extérieure Anti-Fissure – Blanc Satin',
    description:
      'Peinture acrylique haute élasticité pour façades extérieures. Formule anti-fissure et imperméabilisante qui résiste aux UV, aux intempéries et aux moisissures. Couverture jusqu\'à 8 m² par litre.',
    category: 'peinture',
    subCategory: 'peinture façade',
    supplier: supplierId,
    price: 85.00,
    priceUnit: 'TND',
    unit: 'litre',
    stock: { quantity: 400, minOrderQty: 5, alertThreshold: 30 },
    isAvailable: true,
    specifications: [
      { key: 'Contenance', value: '15 litres' },
      { key: 'Prix affiché', value: 'au litre' },
      { key: 'Rendement', value: '6 à 8 m²/L en 2 couches' },
      { key: 'Temps de séchage', value: '2h entre couches' },
      { key: 'Résistance aux UV', value: 'Excellent' },
      { key: 'Élasticité', value: 'Anti-fissure jusqu\'à 1.5mm' },
      { key: 'Application', value: 'Rouleau, brosse ou airless' },
      { key: 'Teinte', value: 'Blanc Satin (teintable en usine)' },
    ],
    useCases: ['Façades extérieures', 'Enduits rénovation', 'Murs humides', 'Zones côtières'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800',
        caption: 'Application peinture façade en rouleau',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800',
        caption: 'Façade rénovée avec peinture extérieure',
      },
    ],
    rating: { average: 4.4, count: 156, recommended: 143 },
    tags: ['peinture', 'façade', 'extérieur', 'anti-fissure', 'imperméable', 'acrylique'],
    views: 2890,
  },

  // 9. Verre Feuilleté Sécurit
  {
    name: 'Verre Feuilleté Sécurit 44.2 – Transparent',
    description:
      'Verre feuilleté de sécurité composé de deux feuilles de verre de 4mm assemblées par film PVB de 0.38mm. En cas de bris, les éclats restent solidaires du film. Certifié EN 14449 pour garde-corps, verrières et baies vitrées.',
    category: 'verre',
    subCategory: 'verre de sécurité',
    supplier: supplierId,
    price: 320.00,
    priceUnit: 'TND',
    unit: 'm²',
    stock: { quantity: 60, minOrderQty: 1, alertThreshold: 5 },
    isAvailable: true,
    specifications: [
      { key: 'Composition', value: '4mm + PVB 0.38mm + 4mm' },
      { key: 'Épaisseur totale', value: '8.38 mm' },
      { key: 'Transmission lumineuse', value: '89%' },
      { key: 'Facteur solaire g', value: '0.86' },
      { key: 'Résistance anti-effraction', value: 'P2A (EN 356)' },
      { key: 'Certification', value: 'CE – EN 14449' },
      { key: 'Dimensions max', value: '2400x3600 mm' },
    ],
    useCases: ['Garde-corps', 'Verrières de toit', 'Vitrage de sécurité', 'Cloisons de bureau', 'Escaliers en verre'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
        caption: 'Garde-corps en verre feuilleté',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1558980663-3685c1d673c4?w=800',
        caption: 'Verrière architecture moderne',
      },
    ],
    rating: { average: 4.7, count: 43, recommended: 41 },
    tags: ['verre', 'feuilleté', 'sécurité', 'garde-corps', 'vitrage', 'transparent'],
    views: 980,
  },

  // 10. Tuyaux PVC Plomberie
  {
    name: 'Tuyau PVC-U Pression PN16 Ø110mm – Barre 6m',
    description:
      'Tuyau en PVC rigide (PVC-U) pour réseaux de distribution d\'eau sous pression. Pression nominale PN16, résistant à la corrosion et aux agressions chimiques. Connexion par joint à lèvre. Idéal pour adduction d\'eau potable et irrigation.',
    category: 'plomberie',
    subCategory: 'tuyauterie pression',
    supplier: supplierId,
    price: 95.00,
    priceUnit: 'TND',
    unit: 'mètre',
    stock: { quantity: 600, minOrderQty: 6, alertThreshold: 30 },
    isAvailable: true,
    specifications: [
      { key: 'Diamètre extérieur', value: '110 mm' },
      { key: 'Épaisseur de paroi', value: '6.6 mm' },
      { key: 'Longueur', value: '6 m' },
      { key: 'Pression nominale', value: 'PN16 (16 bars)' },
      { key: 'Matière', value: 'PVC-U non plastifié' },
      { key: 'Raccordement', value: 'Joint à lèvre SN8' },
      { key: 'Norme', value: 'ISO 1452 / EN 1452' },
      { key: 'Couleur', value: 'Gris clair' },
    ],
    useCases: ['Adduction eau potable', 'Réseau irrigation agricole', 'Distribution eau industrielle', 'Assainissement enterré'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800',
        caption: 'Tuyaux PVC-U sur palette',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1581093577421-f561a654a353?w=800',
        caption: 'Réseau tuyauterie PVC en tranchée',
      },
    ],
    rating: { average: 4.5, count: 98, recommended: 92 },
    tags: ['plomberie', 'PVC', 'tuyau', 'pression', 'irrigation', 'eau potable'],
    views: 1560,
  },
]);

// ── Main ───────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connecté');

    // ── Recherche du fournisseur dans la base de données ──────────────────────
    const SUPPLIER_EMAIL = 'marbre@artisanet.com';
    const supplier = await User.findOne({ email: SUPPLIER_EMAIL }).lean();
    if (!supplier) {
      console.error(`❌ Fournisseur introuvable : ${SUPPLIER_EMAIL}`);
      console.error('   Vérifiez que cet utilisateur existe dans la collection users.');
      process.exit(1);
    }
    console.log(`✅ Fournisseur trouvé : ${supplier.firstName} ${supplier.lastName} (${supplier._id})`);

    const supplierId = supplier._id;

    console.log('🗑️  Suppression des anciens produits du même fournisseur...');
    const deleted = await Product.deleteMany({ supplier: supplierId });
    console.log(`   ${deleted.deletedCount} ancien(s) produit(s) supprimé(s)`);

    console.log('📦 Insertion des 10 nouveaux produits...');
    const products = buildProducts(supplierId);
    const inserted = await Product.insertMany(products);
    console.log(`✅ ${inserted.length} produits insérés avec succès !\n`);

    inserted.forEach((p, i) => {
      console.log(`  ${i + 1}. [${p.category.toUpperCase()}] ${p.name} — ${p.price} ${p.priceUnit}/${p.unit}`);
    });

    console.log('\n🎉 Seed terminé ! Tous les produits appartiennent à : ' + SUPPLIER_EMAIL);
  } catch (err) {
    console.error('❌ Erreur lors du seed :', err.message);
    console.error(err.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
}

seed();
