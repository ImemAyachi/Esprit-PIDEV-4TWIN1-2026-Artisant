/** Connexion MongoDB (MONGO_URI, option MONGO_DNS_SERVERS). */
import dns from 'node:dns';
import mongoose from 'mongoose';

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const connectDB = async () => {
  mongoose.set('bufferCommands', false);

  const extraDns = process.env.MONGO_DNS_SERVERS;
  if (extraDns) {
    dns.setServers(extraDns.split(',').map((s) => s.trim()).filter(Boolean));
  }

  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI non définie dans server/.env — impossible de démarrer l’API.');
    return false;
  }

  try {
    console.log('🔌 Tentative de connexion MongoDB avec :', process.env.MONGO_URI ? 'URI trouvée' : 'URI non définie');
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB déconnecté — tentative de reconnexion...');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnecté');
    });

    return true;
  } catch (error) {
    console.error(`❌ Erreur MongoDB : ${error.message}`);
    if (String(error.message).includes('querySrv')) {
      console.error(
        '   → DNS SRV bloqué ou refusé. Ajoutez dans server/.env : MONGO_DNS_SERVERS=8.8.8.8,8.8.4.4\n' +
        '   → Ou dans Atlas : Connect → Drivers → utilisez la chaîne standard mongodb://… (sans +srv).'
      );
    }
    if (process.env.REQUIRE_MONGODB === 'true') {
      process.exit(1);
    }
    return false;
  }
};

export default connectDB;
