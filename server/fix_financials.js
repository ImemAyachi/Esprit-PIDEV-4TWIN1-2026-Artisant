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
    console.log(`Checking project: ${p.title} (Status: ${p.status})`);
    
    // Fix dirty data (legacy statuses)
    const validStatuses = ['draft', 'open', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(p.status)) {
      console.log(`- Fixing invalid status '${p.status}' to 'draft'`);
      p.status = 'draft';
    }

    // Force recalcule via pre-save hook
    await p.save();
  }
  console.log('Done fixing all projects.');
  await mongoose.disconnect();
}

fix();
