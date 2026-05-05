import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const productSchema = new mongoose.Schema({ name: String, price: Number, unit: String });
const Product = mongoose.model('Product', productSchema);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const products = await Product.find();
  console.log('Current Products:');
  products.forEach(p => {
    console.log(`- ${p.name}: ${p.price} DT / ${p.unit}`);
  });
  process.exit(0);
}
run();
