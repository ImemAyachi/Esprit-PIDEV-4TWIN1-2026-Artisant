import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // Mongoose script running in server folder

async function fixDb() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/artisanet');
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const result = await Product.updateMany(
        { 'stock.quantity': { $gt: 0 }, 'priceRadar.status': 'low' },
        { $set: { isAvailable: true } }
    );
    console.log("Mise à jour des produits en DB:", result);
    process.exit(0);
}
fixDb();
