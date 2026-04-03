import mongoose from 'mongoose';
import 'dotenv/config';

import connectDB from '../config/db.js';
import User from '../models/User.model.js';

const addAdmin = async () => {
  await connectDB();
  
  const email = 'superadmin@test.tn';
  const plainPassword = 'Admin123';
  
  const exists = await User.findOne({ email });
  if (exists) {
    console.log('L\'admin existe déjà dans la base de données !');
    process.exit(0);
  }
  
  await User.create({
    firstName: 'Super',
    lastName: 'Admin Test',
    email,
    password: plainPassword,
    role: 'SuperAdmin',
    isActive: true,
    isVerified: true,
    phone: '+216 71 000 000'
  });
  
  console.log('✅ Nouvel Admin ajouté avec succès !');
  console.log(`Email: ${email}\nMot de passe: ${plainPassword}`);
  
  await mongoose.disconnect();
  process.exit(0);
};

addAdmin().catch((err) => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
