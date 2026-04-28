import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // Mongoose script running in server folder

async function checkDb() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/artisanet');
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const recent = await Product.find({name: 'brique'}).sort({createdAt: -1}).limit(1);
    console.log("Dernier produit 'brique':", JSON.stringify(recent[0], null, 2));
    process.exit(0);
}
checkDb();
