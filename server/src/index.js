/**
 * BuildMarket - Entry Point
 * Initialise Express, Socket.io, MongoDB et démarre le serveur
 */
import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { setupSwagger } from './config/swagger.js';
import { initSocket } from './config/socket.js';

// ---- Routes (Imem's architecture) ----
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import serviceRoutes from './routes/service.routes.js';
import quoteRoutes from './routes/quote.routes.js';
import orderRoutes from './routes/order.routes.js';
import projectRoutes from './routes/project.routes.js';
import reviewRoutes from './routes/review.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import chatRoutes from './routes/chat.routes.js';
import aiRoutes from './routes/ai.routes.js';
import workforceRoutes from './routes/workforce.routes.js';


// ---- Routes (Yahya's unique architecture) ----
// Note: These files will need to be converted to ES Modules (import/export)
// since this project now uses "type": "module".
import documentRoutes from './routes/documentRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Middleware global d'erreurs
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
const httpServer = http.createServer(app);

// Ensure `.env` is loaded from the `server/` folder even if the process
// is started from another working directory.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

function isAllowedOrigin(origin) {
  if (!origin) return true; // server-to-server / curl / same-origin

  const norm = (u) => String(u || '').trim().replace(/\/$/, '');
  const explicit = norm(process.env.CLIENT_URL);
  if (explicit && norm(origin) === explicit) return true;
  const extras = (process.env.CORS_EXTRA_ORIGINS || '')
    .split(',')
    .map((s) => norm(s))
    .filter(Boolean);
  if (extras.length && extras.includes(norm(origin))) return true;

  // Local Vite (ports 5170–5179).
  if (/^http:\/\/localhost:517\d$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1:517\d$/.test(origin)) return true;

  // Vite preview
  if (/^http:\/\/localhost:4173$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1:4173$/.test(origin)) return true;

  // Dev: same machine + LAN when Vite uses `server.host: true` (other PCs / phones on Wi-Fi).
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const lanVite = /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):(517[0-9]|4173)$/;
    if (lanVite.test(origin)) return true;
  }

  return false;
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: {
    origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
    methods: ['GET', 'POST'],
  },
});

// Rendre io accessible dans les controllers via req.io
app.set('io', io);
initSocket(io);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://images.pexels.com", "https://res.cloudinary.com", "https://placehold.co", "https://loremflickr.com"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "http://localhost:5000"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static folder for uploads (from Yahya branch)
app.use('/uploads', express.static(path.join(path.resolve(), '/uploads'), {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

// ─── Swagger Documentation ────────────────────────────────────────────────────
setupSwagger(app);

// ─── Routes API ───────────────────────────────────────────────────────────────
const API = '/api';

// Imem's routes
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/services`, serviceRoutes);
app.use(`${API}/quotes`, quoteRoutes);
app.use(`${API}/orders`, orderRoutes);
app.use(`${API}/projects`, projectRoutes);
app.use(`${API}/reviews`, reviewRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/chat`, chatRoutes);
app.use(`${API}/ai`, aiRoutes);

// Yahya's specific routes
app.use(`${API}/documents`, documentRoutes);
app.use(`${API}/invoices`, invoiceRoutes);
app.use(`${API}/public`, publicRoutes);
app.use(`${API}/uploads`, uploadRoutes);
app.use(`${API}/ai`, aiRoutes);
app.use(`${API}/workforce`, workforceRoutes);

// * Note: The following overlapping routes from Yahya were omitted to prevent conflicts:
// * authRoutes.js, userRoutes.js, productRoutes.js, orderRoutes.js, projectRoutes.js, quoteRoutes.js
// * You will need to manually merge the logic of these overlapping endpoints.

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Artisant API' });
});

// ─── Gestion des erreurs centralisée ─────────────────────────────────────────
app.use(errorHandler);

// ─── Démarrage ────────────────────────────────────────────────────────────────
const BASE_PORT = Number(process.env.PORT) || 5000;

function listenWithFallback(server, port, { maxAttempts = 20 } = {}) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const tryListen = (p) => {
      const onError = (err) => {
        // If port is busy, try the next one.
        if (err && err.code === 'EADDRINUSE' && attempt < maxAttempts) {
          attempt += 1;
          server.removeListener('listening', onListening);
          console.warn(`⚠️  Port ${p} occupé. Tentative sur ${p + 1}...`);
          return tryListen(p + 1);
        }
        return reject(err);
      };

      const onListening = () => {
        server.removeListener('error', onError);
        resolve(p);
      };

      // Ensure handlers only apply to this attempt.
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(p);
    };

    tryListen(port);
  });
}

connectDB().then((ok) => {
  if (!ok) {
    console.warn('\n⚠️  MongoDB indisponible — démarrage en mode dégradé.');
    console.warn('   - Les routes nécessitant la DB peuvent échouer');
    console.warn('   - Certaines fonctionnalités peuvent être limitées sans persistance\n');
  }

  listenWithFallback(httpServer, BASE_PORT)
    .then((port) => {
      console.log(`\n🚀 ARTISANET API démarrée sur http://localhost:${port}`);
      console.log(`📚 Documentation Swagger : http://localhost:${port}/api-docs`);
      console.log(`🔌 Socket.io actif`);
      console.log(`🗄️  MongoDB : ${ok ? process.env.MONGO_URI : 'OFFLINE'}\n`);
    })
    .catch((err) => {
      console.error('❌ Impossible de démarrer le serveur.', err);
      process.exit(1);
    });
});
