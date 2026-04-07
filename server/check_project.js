import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/models/Project.model.js';
import Quote from './src/models/Quote.model.js';
import User from './src/models/User.model.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const p = await Project.findOne().sort({ createdAt: -1 });
  console.log('Project:', JSON.stringify(p, null, 2));
  await mongoose.disconnect();
}

check();
