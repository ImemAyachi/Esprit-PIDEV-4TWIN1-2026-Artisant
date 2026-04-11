import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/models/Project.model.js';
import './src/models/User.model.js';
import './src/models/Quote.model.js';

dotenv.config();

async function debug() {
  await mongoose.connect(process.env.MONGO_URI);
  const p = await Project.findOne().sort({ createdAt: -1 });
  if (p) {
    console.log('--- PROJECT DEBUG ---');
    console.log('ID:', p._id);
    console.log('Budget:', p.budget);
    console.log('Financials:', JSON.stringify(p.financials, null, 2));
    console.log('Artisans:');
    p.artisans?.forEach(a => {
      console.log(`- Status: "${a.status}", Amount: ${a.totalAmount} (${typeof a.totalAmount})`);
    });
  }
  await mongoose.disconnect();
}
debug();
