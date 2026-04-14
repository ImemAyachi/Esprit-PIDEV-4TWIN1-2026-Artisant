import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';

dotenv.config();

const productsData = [
  {
    name: "Marbre Blanc Carrara",
    category: "marbre",
    price: 185,
    unit: "m²",
    description: "Marbre blanc veiné pour sols et plans de travail.",
    media: [{ url: "https://images.unsplash.com/photo-1600607687940-4c700085038c?auto=format&fit=crop&q=80&w=600", type: "image" }]
  },
  {
    name: "Ciment Gris Standard 50kg",
    category: "ciment",
    price: 21,
    unit: "sac",
    description: "Ciment haute résistance pour tous types de travaux.",
    media: [{ url: "https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }]
  },
  {
    name: "Sable de Construction Lavé",
    category: "sable",
    price: 48,
    unit: "tonne",
    description: "Sable tamisé idéal pour mortier et béton.",
    media: [{ url: "https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }]
  },
  {
    name: "Brique Rouge Pleine",
    category: "brique",
    price: 0.9,
    unit: "pièce",
    description: "Brique traditionnelle pour murs porteurs.",
    media: [{ url: "https://images.unsplash.com/photo-1523413555809-0fb1d4da238d?auto=format&fit=crop&q=80&w=600", type: "image" }]
  },
  {
    name: "Poutres en Bois Sapin",
    category: "bois",
    price: 75,
    unit: "pièce",
    description: "Bois de charpente traité pour extérieur.",
    media: [{ url: "https://images.unsplash.com/photo-1589131649646-e58721c56b0d?auto=format&fit=crop&q=80&w=600", type: "image" }]
  },
  {
    name: "Barres d'Acier 12mm",
    category: "acier",
    price: 18,
    unit: "pièce",
    description: "Acier haute adhérence pour ferraillage.",
    media: [{ url: "https://images.pexels.com/photos/38295/pexels-photo-38295.jpeg?auto=compress&cs=tinysrgb&w=600", type: "image" }]
  },
  {
    name: "Peinture Blanche Mate 10L",
    category: "peinture",
    price: 85,
    unit: "sac",
    description: "Peinture acrylique haute couvrance.",
    media: [{ url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600", type: "image" }]
  },
  {
    name: "Robinet Mitigeur Inox",
    category: "plomberie",
    price: 160,
    unit: "pièce",
    description: "Robinetterie moderne pour salle de bain.",
    media: [{ url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600", type: "image" }]
  },
  {
    name: "Carrelage Gris 60x60",
    category: "carrelage",
    price: 55,
    unit: "m²",
    description: "Grès cérame moderne antidérapant.",
    media: [{ url: "https://images.unsplash.com/photo-1595113316349-9fa4eb24f802?auto=format&fit=crop&q=80&w=600", type: "image" }]
  },
  {
    name: "Gaine Électrique ICTA",
    category: "électricité",
    price: 45,
    unit: "pièce",
    description: "Protection câbles encastrés.",
    media: [{ url: "https://images.unsplash.com/photo-1563770660941-20978e8700f1?auto=format&fit=crop&q=80&w=600", type: "image" }]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const supplier = await User.findOne({ role: { $in: ['Fournisseur', 'SuperAdmin'] } });
    await Product.deleteMany({});
    const productsToInsert = productsData.map(p => ({
      ...p,
      supplier: supplier._id,
      priceUnit: "TND",
      isAvailable: true,
      tags: [p.category, "BTP"],
      stock: { quantity: 100, minOrderQty: 1, alertThreshold: 10 }
    }));
    await Product.insertMany(productsToInsert);
    console.log("✅ Catalogue corrigé avec des images 100% cohérentes !");
    process.exit(0);
  } catch (error) {
    console.error("Erreur:", error);
    process.exit(1);
  }
}

seed();
