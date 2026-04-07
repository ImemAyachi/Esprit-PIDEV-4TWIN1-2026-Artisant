import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/models/Project.model.js';
import './src/models/User.model.js';
import './src/models/Quote.model.js';

dotenv.config();

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  const projects = await Project.find({});
  for (const p of projects) {
    console.log(`Recalculating project: ${p.title} (ID: ${p._id})`);
    
    // Manually trigger calculation normally done in pre('save')
    // 1. Revenu = Budget Client
    p.financials.totalRevenue = p.budget || 0;

    // 2. Dépenses = Dépenses manuelles + Somme des contrats artisans acceptés
    const manualExpenses = (p.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const artisanContracts = (p.artisans || [])
      .filter(a => a.status === 'accepted')
      .reduce((sum, a) => sum + (a.totalAmount || 0), 0);

    p.financials.totalExpenses = manualExpenses + artisanContracts;

    // 3. Profit = Revenu - Dépenses
    p.financials.profit = p.financials.totalRevenue - p.financials.totalExpenses;

    // 4. Marge en %
    if (p.financials.totalRevenue > 0) {
      p.financials.profitMargin = Math.round(
        (p.financials.profit / p.financials.totalRevenue) * 100
      );
    } else {
      p.financials.profitMargin = 0;
    }

    // Bypass validation because of legacy dirty data
    await p.save({ validateBeforeSave: false });
  }
  console.log('Done recalculating all projects.');
  await mongoose.disconnect();
}

fix();
