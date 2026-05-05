import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';

import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';

dotenv.config();

const seed = async () => {
  if (!(await connectDB())) {
    console.error('❌ Seed annulé : MongoDB non connecté.');
    process.exit(1);
  }

  console.log('👤 Création des utilisateurs...');
  try {
    // Nettoyage avant seed
    await User.deleteMany({});
    await Product.deleteMany({});

    const usersData = [
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@artisanet.com',
        password: await bcrypt.hash('Admin123!', 12),
        role: 'SuperAdmin',
        isActive: true,
        isVerified: true,
        phone: '+216 71 000 000',
      },
      {
        firstName: 'Sarra',
        lastName: 'Ben Ali',
        email: 'sarra@artisanet.com',
        password: await bcrypt.hash('Architecte123!', 12),
        role: 'Architecte',
        isActive: true,
        isVerified: true,
        phone: '+216 98 123 456',
        specialization: "Architecture d'intérieur",
        location: { city: 'Tunis', country: 'Tunisie' },
        rating: { average: 4.8, count: 12 },
      },
      {
        firstName: 'Hassen',
        lastName: 'Jebali',
        email: 'hassen@artisanet.com',
        password: await bcrypt.hash('Artisan123!', 12),
        role: 'Artisan',
        craft: 'maçon',
        isActive: true,
        isVerified: true,
        phone: '+216 99 456 789',
        experience: 15,
        location: { city: 'Tunis', country: 'Tunisie' },
        rating: { average: 4.7, count: 23 },
      },
      {
        firstName: 'Khaled',
        lastName: 'Marktani',
        email: 'marbre@artisanet.com',
        password: await bcrypt.hash('Fournisseur123!', 12),
        role: 'Fournisseur',
        companyName: 'Marktani Marbres',
        supplierType: 'marbre',
        isActive: true,
        isVerified: true,
        location: { city: 'Tunis', country: 'Tunisie' },
      },
      {
        firstName: 'Fraj',
        lastName: 'Ciment',
        email: 'ciment@artisanet.com',
        password: await bcrypt.hash('Fournisseur123!', 12),
        role: 'Fournisseur',
        companyName: 'CimentPro Tunisie',
        supplierType: 'ciment',
        isActive: true,
        isVerified: true,
        location: { city: 'Bizerte', country: 'Tunisie' },
      }
    ];

    const users = await User.insertMany(usersData);
    const superAdmin = users[0];
    const fournisseur1 = users[3];
    const fournisseur2 = users[4];

    console.log('📦 Création des produits...');
    const productsData = [
      {
        name: 'Marbre Blanc Carrara Premium',
        description: 'Marbre blanc naturel de qualité supérieure, idéal pour les sols et revêtements muraux de luxe.',
        category: 'marbre',
        supplier: fournisseur1._id,
        price: 180,
        unit: 'm²',
        isAvailable: true,
        specifications: [
          { key: 'Épaisseur', value: '2cm' },
          { key: 'Format', value: '60x60cm' },
          { key: 'Finition', value: 'Poli brillant' },
          { key: 'Origine', value: 'Italie' },
        ],
        media: [{ url: "https://images.unsplash.com/photo-1600607687940-4c700085038c?auto=format&fit=crop&q=80&w=600", type: "image" }],
        useCases: ['Sol de salon', 'Revêtement mural salle de bain', 'Escaliers'],
        tags: ['luxe', 'blanc', 'importé', 'brillant', 'BTP'],
        stock: { quantity: 500, minOrderQty: 5, alertThreshold: 10 },
        rating: { average: 4.8, count: 24 },
      },
      {
        name: 'Ciment CEM II 42.5 — Sac 50kg',
        description: 'Ciment Portland composite haute résistance pour tous travaux de maçonnerie, béton armé et enduits.',
        category: 'ciment',
        supplier: fournisseur2._id,
        price: 22.5,
        unit: 'sac',
        isAvailable: true,
        specifications: [
          { key: 'Classe', value: 'CEM II 42.5N' },
          { key: 'Poids', value: '50kg' },
          { key: 'Norme', value: 'EN 197-1' },
        ],
        media: [{ url: "https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }],
        useCases: ['Fondations', 'Dallage', 'Béton armé', 'Enduits'],
        tags: ['construction', 'résistant', 'standard', 'BTP'],
        stock: { quantity: 2000, minOrderQty: 10, alertThreshold: 50 },
        rating: { average: 4.6, count: 45 },
      },
      {
        name: 'Sable de Construction Lavé 0/4',
        description: 'Sable fin lavé et calibré 0/4mm pour mortiers et enduits. Livraison sur chantier disponible.',
        category: 'sable',
        supplier: fournisseur2._id,
        price: 48,
        unit: 'tonne',
        isAvailable: true,
        specifications: [
          { key: 'Granulométrie', value: '0/4mm' },
          { key: 'Traitement', value: 'Lavé calibré' },
        ],
        media: [{ url: "https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }],
        useCases: ['Mortier de pose', 'Enduits', 'Béton'],
        tags: ['sable', 'construction', 'vrac', 'BTP'],
        stock: { quantity: 5000, minOrderQty: 1, alertThreshold: 100 },
        rating: { average: 4.2, count: 27 },
      },

      // ── Cuisine / Salle de bain (plomberie) ──────────────────────────────
      {
        name: 'Évier Inox 1 Bac — 50x40cm',
        description: 'Évier en acier inoxydable pour cuisine, résistant à la corrosion, installation encastrée.',
        category: 'plomberie',
        supplier: fournisseur2._id,
        price: 95,
        unit: 'pièce',
        isAvailable: true,
        specifications: [
          { key: 'Matière', value: 'Inox 304' },
          { key: 'Dimensions', value: '50x40cm' },
          { key: 'Type', value: '1 bac' },
        ],
        media: [{ url: "https://images.pexels.com/photos/6207796/pexels-photo-6207796.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }],
        useCases: ['Cuisine', 'Kitchenette'],
        tags: ['évier', 'inox', 'cuisine', 'plomberie', 'BTP'],
        stock: { quantity: 120, minOrderQty: 1, alertThreshold: 10 },
        rating: { average: 4.5, count: 18 },
      },
      {
        name: 'Mitigeur Cuisine Chromé — Bec Haut',
        description: 'Robinet mitigeur cuisine à bec haut, cartouche céramique, finition chromée.',
        category: 'plomberie',
        supplier: fournisseur2._id,
        price: 79,
        unit: 'pièce',
        isAvailable: true,
        specifications: [
          { key: 'Finition', value: 'Chromée' },
          { key: 'Type', value: 'Mitigeur' },
          { key: 'Cartouche', value: 'Céramique 35mm' },
        ],
        media: [{ url: "https://images.pexels.com/photos/6508027/pexels-photo-6508027.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }],
        useCases: ['Cuisine'],
        tags: ['robinet', 'mitigeur', 'cuisine', 'chromé', 'plomberie'],
        stock: { quantity: 90, minOrderQty: 1, alertThreshold: 10 },
        rating: { average: 4.4, count: 22 },
      },
      {
        name: 'Siphon Évier PVC — Ø40',
        description: 'Siphon pour évier, PVC robuste, compatible Ø40, montage facile.',
        category: 'plomberie',
        supplier: fournisseur2._id,
        price: 12,
        unit: 'pièce',
        isAvailable: true,
        specifications: [
          { key: 'Diamètre', value: 'Ø40' },
          { key: 'Matière', value: 'PVC' },
        ],
        media: [{ url: "https://images.pexels.com/photos/5691590/pexels-photo-5691590.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }],
        useCases: ['Cuisine', 'Salle de bain'],
        tags: ['siphon', 'pvc', 'évier', 'plomberie', 'installation'],
        stock: { quantity: 300, minOrderQty: 2, alertThreshold: 30 },
        rating: { average: 4.1, count: 40 },
      },

      // ── Cuisine / Salle de bain (carrelage) ──────────────────────────────
      {
        name: 'Faïence Murale Blanche Brillante — 20x30',
        description: 'Faïence murale pour cuisine et salle de bain, finition brillante, facile à nettoyer.',
        category: 'carrelage',
        supplier: fournisseur1._id,
        price: 29,
        unit: 'm²',
        isAvailable: true,
        specifications: [
          { key: 'Format', value: '20x30cm' },
          { key: 'Finition', value: 'Brillante' },
          { key: 'Usage', value: 'Mur intérieur' },
        ],
        media: [{ url: "https://images.pexels.com/photos/6208086/pexels-photo-6208086.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }],
        useCases: ['Crédence cuisine', 'Mur salle de bain'],
        tags: ['faïence', 'carrelage', 'blanc', 'cuisine', 'salle de bain'],
        stock: { quantity: 800, minOrderQty: 5, alertThreshold: 50 },
        rating: { average: 4.3, count: 31 },
      },
      {
        name: 'Carrelage Sol Grès Cérame Gris — 60x60',
        description: 'Grès cérame pour sol, antidérapant, idéal cuisine et zones humides.',
        category: 'carrelage',
        supplier: fournisseur1._id,
        price: 45,
        unit: 'm²',
        isAvailable: true,
        specifications: [
          { key: 'Format', value: '60x60cm' },
          { key: 'Classement', value: 'Antidérapant R10' },
          { key: 'Usage', value: 'Sol intérieur' },
        ],
        media: [{ url: "https://images.pexels.com/photos/6297410/pexels-photo-6297410.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }],
        useCases: ['Sol cuisine', 'Sol salle de bain'],
        tags: ['grès cérame', 'sol', 'gris', 'carrelage', 'antidérapant'],
        stock: { quantity: 650, minOrderQty: 5, alertThreshold: 50 },
        rating: { average: 4.4, count: 28 },
      },

      // ── Électricité (cuisine) ─────────────────────────────────────────────
      {
        name: 'Prise Murale Double — Blanc (16A)',
        description: 'Prise double encastrable 16A, finition blanche, pour cuisine et usage domestique.',
        category: 'électricité',
        supplier: fournisseur2._id,
        price: 8.5,
        unit: 'pièce',
        isAvailable: true,
        specifications: [
          { key: 'Intensité', value: '16A' },
          { key: 'Type', value: 'Double' },
          { key: 'Montage', value: 'Encastrement' },
        ],
        media: [{ url: "https://images.pexels.com/photos/4792509/pexels-photo-4792509.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }],
        useCases: ['Cuisine', 'Chambres', 'Salon'],
        tags: ['prise', 'électricité', '16a', 'encastrable', 'BTP'],
        stock: { quantity: 1000, minOrderQty: 5, alertThreshold: 100 },
        rating: { average: 4.2, count: 60 },
      },
      {
        name: 'Spot LED Encastrable — 7W Blanc Chaud',
        description: 'Spot LED encastrable 7W, lumière blanc chaud, faible consommation, idéal cuisine et couloir.',
        category: 'électricité',
        supplier: fournisseur2._id,
        price: 11,
        unit: 'pièce',
        isAvailable: true,
        specifications: [
          { key: 'Puissance', value: '7W' },
          { key: 'Température', value: '3000K (blanc chaud)' },
          { key: 'Durée de vie', value: '25 000h' },
        ],
        media: [{ url: "https://images.pexels.com/photos/5824528/pexels-photo-5824528.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }],
        useCases: ['Cuisine', 'Couloir', 'Salon'],
        tags: ['spot', 'led', 'éclairage', 'encastrable', 'électricité'],
        stock: { quantity: 700, minOrderQty: 5, alertThreshold: 80 },
        rating: { average: 4.3, count: 52 },
      },

      // ── Bois (mobilier cuisine) ───────────────────────────────────────────
      {
        name: 'Panneau MDF Hydrofuge — 18mm',
        description: 'Panneau MDF hydrofuge pour meubles de cuisine et pièces humides, facile à découper.',
        category: 'bois',
        supplier: fournisseur1._id,
        price: 58,
        unit: 'pièce',
        isAvailable: true,
        specifications: [
          { key: 'Épaisseur', value: '18mm' },
          { key: 'Type', value: 'Hydrofuge' },
          { key: 'Format', value: '244x122cm' },
        ],
        media: [{ url: "https://images.pexels.com/photos/4491876/pexels-photo-4491876.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }],
        useCases: ['Meubles cuisine', 'Placards', 'Habillage'],
        tags: ['mdf', 'hydrofuge', 'bois', 'cuisine', 'menuiserie'],
        stock: { quantity: 240, minOrderQty: 1, alertThreshold: 20 },
        rating: { average: 4.4, count: 19 },
      },

      // ── Peinture (finition cuisine) ───────────────────────────────────────
      {
        name: 'Peinture Acrylique Satin — Blanc (5L)',
        description: 'Peinture acrylique satin lavable, idéale cuisine et zones à forte utilisation.',
        category: 'peinture',
        supplier: fournisseur1._id,
        price: 65,
        unit: 'litre',
        isAvailable: true,
        specifications: [
          { key: 'Finition', value: 'Satin lavable' },
          { key: 'Contenance', value: '5L' },
          { key: 'Rendement', value: '10–12 m²/L' },
        ],
        media: [{ url: "https://images.pexels.com/photos/6474475/pexels-photo-6474475.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }],
        useCases: ['Cuisine', 'Salon', 'Chambres'],
        tags: ['peinture', 'acrylique', 'lavable', 'blanc', 'finitions'],
        stock: { quantity: 400, minOrderQty: 1, alertThreshold: 30 },
        rating: { average: 4.2, count: 34 },
      }
    ];

    await Product.insertMany(productsData);
    console.log('✅ Seed terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur pendant le seed :', error);
    process.exit(1);
  }
};


seed();
