import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../..', '.env') });

const DATASET_PATH = 'c:/Users/ala/Desktop/piweb/modele-produit/construction_showroom_tunisia.csv';

// Simple CSV parser
function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim() !== '');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    let obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i];
    });
    return obj;
  });
}

async function seedDataset() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connected to MongoDB');

    if (!fs.existsSync(DATASET_PATH)) {
      console.error(`❌ Dataset not found at ${DATASET_PATH}`);
      process.exit(1);
    }

    const content = fs.readFileSync(DATASET_PATH, 'utf-8');
    const records = parseCSV(content);

    // Get an admin or default supplier to own these products
    let supplier = await User.findOne({ role: 'Fournisseur' });
    if (!supplier) {
      supplier = await User.create({
        firstName: 'System',
        lastName: 'Supplier',
        email: 'system.supplier@buildmarket.tn',
        password: 'password123',
        role: 'Fournisseur',
        companyName: 'BuildMarket Dataset'
      });
      console.log('👤 Created default supplier');
    }

    console.log(`🧹 Clearing old dataset products...`);
    await Product.deleteMany({ 'tags': 'dataset_seed' });

    console.log(`🌱 Seeding ${records.length} products from dataset...`);
    
    // Map CSV columns to Product schema
    const productsToInsert = records.map(record => ({
      name: `${record.type_produit} - ${record.marque} (${record.qualite} étoiles)`,
      description: `Produit: ${record.type_produit}, Catégorie: ${record.categorie_produit}, Marque: ${record.marque}, Idéal pour projet: ${record.type_projet}`,
      // Try to match the specific type to a category, else use the raw category from the dataset
      category: ['marbre', 'granit', 'ciment', 'sable', 'carrelage', 'brique', 'bois', 'acier', 'verre', 'peinture', 'plomberie', 'électricité', 'isolation', 'quincaillerie', 'maconnerie', 'etancheite', 'menuiserie', 'autre'].includes(record.type_produit.toLowerCase()) 
                ? record.type_produit.toLowerCase() 
                : (['marbre', 'granit', 'ciment', 'sable', 'carrelage', 'brique', 'bois', 'acier', 'verre', 'peinture', 'plomberie', 'électricité', 'isolation', 'quincaillerie', 'maconnerie', 'etancheite', 'menuiserie', 'autre'].includes(record.categorie_produit.toLowerCase()) 
                    ? record.categorie_produit.toLowerCase() 
                    : 'autre'),      price: Number(record.prix_unitaire),
      supplier: supplier._id,
      stock: { quantity: Number(record.quantite), minOrderQty: 1, alertThreshold: 10 },
      rating: { average: Number(record.qualite), count: Number(record.popularite) },
      tags: ['dataset_seed', record.categorie_produit, record.type_produit, record.marque],
      specifications: [
        { key: 'Localisation', value: record.localisation },
        { key: 'Qualité', value: `${record.qualite}/5` },
        { key: 'Score IA', value: record.score_global }
      ]
    }));

    // Insert all dataset records
    await Product.insertMany(productsToInsert);
    
    console.log(`✅ Successfully seeded ${productsToInsert.length} products to database!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding dataset:', error);
    process.exit(1);
  }
}

seedDataset();
