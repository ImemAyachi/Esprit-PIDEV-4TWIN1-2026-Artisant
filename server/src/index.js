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
import 'dotenv/config';
import path from 'path';

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

function isAllowedOrigin(origin) {
  if (!origin) return true; // server-to-server / curl / same-origin

  const explicit = (process.env.CLIENT_URL || '').trim();
  if (explicit && origin === explicit) return true;

  // Allow local dev ports (Vite often auto-increments).
  if (/^http:\/\/localhost:517\d$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1:517\d$/.test(origin)) return true;

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
app.use(helmet());
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
const PORT = process.env.PORT || 5000;

connectDB().then((ok) => {
  if (!ok) {
    console.error('\n❌ Arrêt : MongoDB doit être connecté avant d’accepter des requêtes (inscription, etc.).');
    console.error('   Vérifiez MONGO_URI dans server/.env et que MongoDB est accessible.\n');
    process.exit(1);
  }

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 ARTISANET API démarrée sur http://localhost:${PORT}`);
    console.log(`📚 Documentation Swagger : http://localhost:${PORT}/api-docs`);
    console.log(`🔌 Socket.io actif`);
    console.log(`🗄️  MongoDB : ${process.env.MONGO_URI}\n`);
  });
});
