import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/models/Project.model.js';
import './src/models/User.model.js';
import './src/models/Quote.model.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const p = await Project.findOne().sort({ createdAt: -1 });
  if (p) {
    console.log('NAME:', p.title);
    console.log('BUDGET:', p.budget);
    console.log('ARTISANS:', p.artisans?.map(a => `${a.status}:${a.totalAmount}`));
    console.log('EXPENSES SUM:', p.expenses?.reduce((s,e) => s + e.amount, 0));
    
    // Recalculate manually here
    const mc = (p.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const ac = (p.artisans || []).filter(a => a.status === 'accepted').reduce((sum, a) => sum + (a.totalAmount || 0), 0);
    console.log('CALCULATED EXP:', mc + ac);
    
    p.financials.totalExpenses = mc + ac;
    p.financials.totalRevenue = p.budget;
    p.financials.profit = p.financials.totalRevenue - p.financials.totalExpenses;
    
    console.log('FORCED FIN:', JSON.stringify(p.financials, null, 2));
    await p.save({ validateBeforeSave: false });
  }
  await mongoose.disconnect();
}
check();
