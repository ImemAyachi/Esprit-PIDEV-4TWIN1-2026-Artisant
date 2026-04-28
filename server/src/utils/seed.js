/**
 * Script de seed — Données de test pour MongoDB
 *
 * Exécuter : npm run seed (depuis le dossier server/)
 *
 * Crée :
 *   - 1 SuperAdmin
 *   - 2 Architectes, 2 Ingénieurs
 *   - 3 Artisans (maçon, plombier, électricien)
 *   - 2 Fournisseurs (marbre, ciment)
 *   - 5 Produits exemples
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

import connectDB from '../config/db.js';
import User from '../models/User.model.js';
import Product from '../models/Product.model.js';

const seed = async () => {
  if (!(await connectDB())) {
    console.error('❌ Seed annulé : MongoDB non connecté.');
    process.exit(1);
  }

  console.log('🌱 Suppression des données existantes...');
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
  ]);

  console.log('👤 Création des utilisateurs...');

  const users = await User.insertMany([
    // ── SuperAdmin ──────────────────────────────────────────────────────
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
    // ── Architectes ─────────────────────────────────────────────────────
    {
      firstName: 'Sarra',
      lastName: 'Ben Ali',
      email: 'sarra@artisanet.com',
      password: await bcrypt.hash('Architecte123!', 12),
      role: 'Architecte',
      isActive: true,
      isVerified: true,
      phone: '+216 98 123 456',
      specialization: 'Architecture d\'intérieur',
      location: { city: 'Tunis', country: 'Tunisie' },
      rating: { average: 4.8, count: 12 },
    },
    {
      firstName: 'Mohamed',
      lastName: 'Kacem',
      email: 'kacem@artisanet.com',
      password: await bcrypt.hash('Architecte123!', 12),
      role: 'Architecte',
      isActive: true,
      isVerified: true,
      phone: '+216 52 234 567',
      specialization: 'Architecture bioclimatique',
      location: { city: 'Sfax', country: 'Tunisie' },
      rating: { average: 4.5, count: 8 },
    },
    // ── Ingénieurs ──────────────────────────────────────────────────────
    {
      firstName: 'Anis',
      lastName: 'Trabelsi',
      email: 'anis@artisanet.com',
      password: await bcrypt.hash('Ingenieur123!', 12),
      role: 'Ingenieur',
      isActive: true,
      isVerified: true,
      phone: '+216 55 345 678',
      specialization: 'Génie civil',
      location: { city: 'Tunis', country: 'Tunisie' },
    },
    // ── Artisans ─────────────────────────────────────────────────────────
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
      firstName: 'Karim',
      lastName: 'Hamdi',
      email: 'karim@artisanet.com',
      password: await bcrypt.hash('Artisan123!', 12),
      role: 'Artisan',
      craft: 'plombier',
      isActive: true,
      isVerified: true,
      phone: '+216 22 567 890',
      experience: 8,
      location: { city: 'Sousse', country: 'Tunisie' },
      rating: { average: 4.3, count: 15 },
    },
    {
      firstName: 'Nabil',
      lastName: 'Sassi',
      email: 'nabil@artisanet.com',
      password: await bcrypt.hash('Artisan123!', 12),
      role: 'Artisan',
      craft: 'électricien',
      isActive: true,
      isVerified: true,
      phone: '+216 55 678 901',
      experience: 12,
      location: { city: 'Tunis', country: 'Tunisie' },
      rating: { average: 4.9, count: 31 },
    },
    // ── Fournisseurs ─────────────────────────────────────────────────────
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
    },
  ]);

  const [superAdmin, arch1, arch2, ing1, artisan1, artisan2, artisan3, fournisseur1, fournisseur2] = users;

  console.log('📦 Création des produits...');

  await Product.insertMany([
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
      useCases: ['Sol de salon', 'Revêtement mural salle de bain', 'Escaliers'],
      tags: ['luxe', 'blanc', 'importé', 'brillant'],
      stock: { quantity: 500, minOrderQty: 5 },
      rating: { average: 4.8, count: 24 },
    },
    {
      name: 'Marbre Beige Crema Marfil',
      description: 'Marbre beige chaleureux aux veines dorées, parfait pour créer des ambiances élégantes.',
      category: 'marbre',
      supplier: fournisseur1._id,
      price: 145,
      unit: 'm²',
      isAvailable: true,
      specifications: [
        { key: 'Épaisseur', value: '2cm' },
        { key: 'Format', value: '60x30cm' },
        { key: 'Finition', value: 'Adouci' },
      ],
      useCases: ['Sol chambre', 'Cuisine plan de travail'],
      tags: ['beige', 'chaud', 'classique'],
      stock: { quantity: 300, minOrderQty: 5 },
      rating: { average: 4.5, count: 18 },
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
      useCases: ['Fondations', 'Dallage', 'Béton armé', 'Enduits'],
      tags: ['construction', 'résistant', 'standard'],
      stock: { quantity: 2000, minOrderQty: 10 },
      rating: { average: 4.6, count: 45 },
    },
    {
      name: 'Carrelage Gris Anthracite Mat 60x60',
      description: 'Carrelage grès cérame rectifié, aspect béton moderne. Anti-dérapant, idéal pour espaces de vie.',
      category: 'carrelage',
      supplier: fournisseur1._id,
      price: 68,
      unit: 'm²',
      isAvailable: true,
      specifications: [
        { key: 'Format', value: '60x60cm' },
        { key: 'Épaisseur', value: '10mm' },
        { key: 'Finition', value: 'Mat' },
        { key: 'Glissance', value: 'R10' },
      ],
      useCases: ['Salon', 'Cuisine', 'Terrasse couverte'],
      tags: ['gris', 'moderne', 'béton', 'mat'],
      stock: { quantity: 800, minOrderQty: 10 },
      rating: { average: 4.4, count: 33 },
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
      useCases: ['Mortier de pose', 'Enduits', 'Béton'],
      tags: ['sable', 'construction', 'vrac'],
      stock: { quantity: 5000, minOrderQty: 1 },
      rating: { average: 4.2, count: 27 },
    },
  ]);

  console.log('\n✅ Seed terminé avec succès !');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Comptes de test :');
  console.log('  SuperAdmin     : admin@artisanet.com        / Admin123!');
  console.log('  Architecte     : sarra@artisanet.com        / Architecte123!');
  console.log('  Ingénieur      : anis@artisanet.com         / Ingenieur123!');
  console.log('  Artisan maçon  : hassen@artisanet.com       / Artisan123!');
  console.log('  Artisan élec.  : nabil@artisanet.com        / Artisan123!');
  console.log('  Fournisseur    : marbre@artisanet.com       / Fournisseur123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed échoué :', err);
  process.exit(1);
});
