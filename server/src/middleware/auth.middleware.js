/**
 * Middleware d'authentification JWT
 * Vérifie le token Bearer dans le header Authorization
 * Attache l'utilisateur à req.user
 */
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

export const protect = async (req, res, next) => {
  let token;

  // Récupérer le token depuis le header Authorization: Bearer <token>
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Accès refusé — authentification requise',
    });
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur depuis la DB (et vérifier qu'il est toujours actif)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé — contactez l\'administrateur',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré',
    });
  }
};

/**
 * Middleware de restriction par rôle
 * Usage : authorize('SuperAdmin', 'Architecte')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Rôle '${req.user.role}' non autorisé pour cette action`,
      });
    }
    next();
  };
};
