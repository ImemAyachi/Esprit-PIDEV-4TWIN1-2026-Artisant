/**
 * Connexion MongoDB avec Mongoose
 * Utilise MONGO_URI depuis .env
 */
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log('🔌 Tentative de connexion MongoDB avec :', process.env.MONGO_URI ? 'URI trouvée' : 'URI non définie');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 7+ n'a plus besoin de useNewUrlParser / useUnifiedTopology
    });

    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);

    // Événements de connexion
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB déconnecté — tentative de reconnexion...');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnecté');
    });
  } catch (error) {
    console.error(`❌ Erreur MongoDB : ${error.message}`);
    console.warn("Le serveur reste en ligne — tentaive de reconnexion automatique en arrière-plan...");
  }
};

export default connectDB;
