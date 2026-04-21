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
