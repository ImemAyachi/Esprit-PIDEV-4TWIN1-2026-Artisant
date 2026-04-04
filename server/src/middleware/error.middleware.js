import fs from 'fs';
/**
 * Middleware centralisé de gestion des erreurs
 * Intercepte toutes les erreurs non gérées et retourne une réponse JSON cohérente
 */

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Erreur serveur interne';

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Doublon (email unique, etc.)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} déjà utilisé`;
  }

  // Token JWT invalide
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide';
  }

  // Token JWT expiré
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expiré — veuillez vous reconnecter';
  }

  // ID MongoDB invalide (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `ID invalide : ${err.value}`;
  }

  // Log en développement et dans un fichier pour debug
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
    try {
      const timestamp = new Date().toISOString();
      const logMsg = `[${timestamp}] ${req.method} ${req.url} - ${err.stack || err.message}\n`;
      fs.appendFileSync('server_errors.log', logMsg);
    } catch (e) {
      console.error('Impossible d\'écrire dans le log:', e);
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Stack trace uniquement en développement
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Classe d'erreur personnalisée pour les erreurs métier
 * Usage : throw new AppError('Message', 404)
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wrapper async pour éviter les try/catch répétitifs dans les controllers
 * Usage : router.get('/', asyncHandler(myController))
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
