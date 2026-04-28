import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Product from './src/models/Product.model.js';

async function debug() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/artisanet');
        console.log("Connecté à MongoDB");

        const lastProduct = await Product.findOne().sort({ createdAt: -1 });
        
        if (!lastProduct) {
            console.log("Aucun produit trouvé.");
            return;
        }

        console.log("--- DERNIER PRODUIT AJOUTÉ ---");
        console.log("Nom:", lastProduct.name);
        console.log("Prix:", lastProduct.price);
        console.log("Catégorie:", lastProduct.category);
        console.log("PriceRadar Data:", JSON.stringify(lastProduct.priceRadar, null, 2));
        
        if (lastProduct.priceRadar?.status === 'low') {
            console.log(">>> STATUT OK: Le produit est bien marqué comme LOW (Chance).");
        } else {
            console.log(">>> ERREUR STATUT: Le produit est marqué comme", lastProduct.priceRadar?.status);
        }

    } catch (err) {
        console.error("Erreur de debug:", err);
    } finally {
        mongoose.connection.close();
    }
}

debug();
