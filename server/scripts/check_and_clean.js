import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const productSchema = new mongoose.Schema({ name: String, supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } });
const userSchema = new mongoose.Schema({ firstName: String, lastName: String, companyName: String });

const Product = mongoose.model('Product', productSchema);
const User = mongoose.model('User', userSchema);

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const products = await Product.find().populate('supplier', 'firstName lastName companyName');
    console.log('Current products count:', products.length);
    
    products.forEach(p => {
      console.log(`- ID: ${p._id}, Name: ${p.name}, Price: ${p.price}, Supplier: ${p.supplier?.companyName || p.supplier?.firstName}`);
    });

    const target = products.find(p => p.name.toLowerCase() === 'marbre');
    if (target) {
        console.log('\nTarget found:', target._id);
        const result = await Product.deleteMany({ _id: { $ne: target._id } });
        console.log('Deleted products:', result.deletedCount);
    } else {
        console.log('\nNo product named "marbre" found to keep.');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
