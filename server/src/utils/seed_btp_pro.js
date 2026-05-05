import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';

dotenv.config();

// Fonction utilitaire pour générer une URL avec une VRAIE image Flickr pertinente
const getRealImage = (keyword, id = 1) => {
  // on utilise 'lock' pour s'assurer que la même image est rendue pour le même produit
  // sinon loremflickr renvoie une image au hasard à chaque chargement !
  return `https://loremflickr.com/800/600/${keyword}?lock=${id}`;
};

const productsData = [
  {
    name: "Marbre Blanc Carrara",
    category: "marbre",
    price: 320,
    unit: "m²",
    description: "Marbre blanc premium veiné pour sols luxueux et plans de travail haut de gamme.",
    media: [{ url: getRealImage("marble,stone", 101), type: "image", caption: "Marbre Blanc" }]
  },
  {
    name: "Granit Noir Absolu",
    category: "granit",
    price: 280,
    unit: "m²",
    description: "Granit noir intense, poli, extrêmement résistant aux rayures et à la chaleur.",
    media: [{ url: getRealImage("granite,black", 102), type: "image", caption: "Granit Noir" }]
  },
  {
    name: "Ciment Gris CPJ45",
    category: "ciment",
    price: 18.5,
    unit: "sac",
    description: "Ciment gris de haute performance pour tous travaux de maçonnerie et béton armé.",
    media: [{ url: getRealImage("cement,bags", 103), type: "image", caption: "Sac de ciment 50kg" }]
  },
  {
    name: "Sable Fin Lavé",
    category: "sable",
    price: 65,
    unit: "tonne",
    description: "Sable de carrière lavé et tamisé, idéal pour les enduits et mortiers fins.",
    media: [{ url: getRealImage("sand,construction", 104), type: "image" }]
  },
  {
    name: "Carrelage Effet Parquet",
    category: "carrelage",
    price: 58,
    unit: "m²",
    description: "Grès cérame émaillé imitation bois, alliant esthétique et facilité d'entretien.",
    media: [{ url: getRealImage("tiles,floor", 105), type: "image" }]
  },
  {
    name: "Brique Rouge Creuse 12 Trous",
    category: "brique",
    price: 0.85,
    unit: "pièce",
    description: "Brique de terre cuite standard pour cloisons et isolation thermique.",
    media: [{ url: getRealImage("bricks,red", 106), type: "image" }]
  },
  {
    name: "Poutre Bois Chêne Massif",
    category: "bois",
    price: 145,
    unit: "mètre",
    description: "Bois noble pour charpentes apparentes et aménagement décoratif robuste.",
    media: [{ url: getRealImage("timber,wood", 107), type: "image" }]
  },
  {
    name: "Rond à béton Acier FE500",
    category: "acier",
    price: 2400,
    unit: "tonne",
    description: "Armatures en acier pour le renforcement du béton dans les structures.",
    media: [{ url: getRealImage("rebar,steel", 108), type: "image" }]
  },
  {
    name: "Double Vitrage Sécurit",
    category: "verre",
    price: 210,
    unit: "m²",
    description: "Verre isolant haute performance avec traitement anti-effraction.",
    media: [{ url: getRealImage("window,glass", 109), type: "image" }]
  },
  {
    name: "Peinture Glycéro Extérieur",
    category: "peinture",
    price: 120,
    unit: "litre",
    description: "Peinture haute protection pour façades et boiseries extérieures.",
    media: [{ url: getRealImage("paint,bucket", 110), type: "image" }]
  },
  {
    name: "Tuyau Cuivre 16mm",
    category: "plomberie",
    price: 12,
    unit: "mètre",
    description: "Tube cuivre de qualité pour installations sanitaires et chauffage.",
    media: [{ url: getRealImage("copper,pipes", 111), type: "image" }]
  },
  {
    name: "Ensemble Tableaux Électriques",
    category: "électricité",
    price: 450,
    unit: "pièce",
    description: "Coffret complet avec disjoncteurs pour installation domestique.",
    media: [{ url: getRealImage("electrical,panel", 112), type: "image" }]
  },
  {
    name: "Plaque de Plâtre BA13",
    category: "autre",
    price: 15.5,
    unit: "pièce",
    description: "Panneau de cloison sèche pour finitions interieures.",
    media: [{ url: getRealImage("drywall,plaster", 113), type: "image" }]
  }
];

async function seed() {
  try {
    console.log('🚀 Démarrage du seeding BTP Pro avec les VRAIES images (Flickr)...');
    await mongoose.connect(process.env.MONGO_URI);
    
    // Trouver un utilisateur administrateur ou fournisseur pour être le propriétaire
    let supplier = await User.findOne({ role: { $in: ['Fournisseur', 'SuperAdmin'] } });
    if (!supplier) {
       // Créer un utilisateur temporaire si aucun n'existe
       console.log('👤 Création d\'un fournisseur de démonstration...');
       supplier = await User.create({
         firstName: "Ahmed",
         lastName: "Alami",
         email: "ahmed.fournisseur@artisant.tn",
         password: "password123",
         role: "Fournisseur",
         companyName: "Artisanet Materials Local",
         isVerified: true,
         isActive: true
       });
    }

    await Product.deleteMany({});
    console.log('🗑️  Catalogue existant vidé.');

    const productsToInsert = productsData.map(p => ({
      ...p,
      supplier: supplier._id,
      priceUnit: "TND",
      isAvailable: true,
      tags: [p.category, "BTP", "Construction"],
      stock: { quantity: 150, minOrderQty: 1, alertThreshold: 10 }
    }));

    await Product.insertMany(productsToInsert);
    console.log(`✅ ${productsToInsert.length} produits avec images réelles ajoutés avec succès !`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur de seeding:", error);
    process.exit(1);
  }
}

seed();
