/**
 * Auth Controller — Inscription, connexion, profil
 *
 * POST /api/auth/register  — Inscription avec choix du rôle
 * POST /api/auth/login     — Connexion + génération JWT
 * GET  /api/auth/me        — Profil courant
 * PUT  /api/auth/me        — Mise à jour du profil
 */
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

// Génère un JWT signé avec l'ID utilisateur
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscrire un nouveau compte
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, role]
 *             properties:
 *               firstName:  { type: string }
 *               lastName:   { type: string }
 *               email:      { type: string }
 *               password:   { type: string, minLength: 8 }
 *               role:       { type: string, enum: [Architecte, Ingenieur, Fournisseur, Artisan] }
 *               phone:      { type: string }
 *               craft:      { type: string, description: "Pour les Artisans uniquement" }
 *               companyName:{ type: string, description: "Pour les Fournisseurs" }
 *     responses:
 *       201:
 *         description: Compte créé avec succès (en attente de validation)
 */
export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, phone, craft, companyName, supplierType, specialization } = req.body;

  // Le SuperAdmin ne peut pas s'inscrire via l'API publique
  if (role === 'SuperAdmin') {
    throw new AppError('Inscription SuperAdmin non autorisée', 403);
  }

  const userExists = await User.findOne({ email });
  if (userExists) throw new AppError('Email déjà utilisé', 400);

  const user = await User.create({
    firstName, lastName, email, password, role, phone,
    craft, companyName, supplierType, specialization,
    // Les professionnels nécessitent validation Admin (sauf en dev)
    isVerified: process.env.NODE_ENV === 'development',
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: role === 'SuperAdmin'
      ? 'Compte créé'
      : 'Compte créé — en attente de validation par l\'administrateur',
    token,
    user: {
      _id:        user._id,
      firstName:  user.firstName,
      lastName:   user.lastName,
      email:      user.email,
      role:       user.role,
      isVerified: user.isVerified,
      avatar:     user.avatar,
    },
  });
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Se connecter
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Connexion réussie avec token JWT
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email et mot de passe requis', 400);
  }

  // select('+password') car le champ est select:false dans le modèle
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  if (!user.isActive) {
    throw new AppError('Compte désactivé — contactez l\'administrateur', 403);
  }

  // Mettre à jour lastLogin
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.json({
    success: true,
    token,
    user: {
      _id:        user._id,
      firstName:  user.firstName,
      lastName:   user.lastName,
      email:      user.email,
      role:       user.role,
      isVerified: user.isVerified,
      isActive:   user.isActive,
      avatar:     user.avatar,
      craft:      user.craft,
      rating:     user.rating,
    },
  });
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Profil utilisateur
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

export const updateMe = asyncHandler(async (req, res) => {
  // Champs non modifiables via ce endpoint
  const forbidden = ['password', 'role', 'email', 'isVerified', 'isActive'];
  forbidden.forEach((field) => delete req.body[field]);

  const user = await User.findByIdAndUpdate(req.user._id, req.body, {
    new:              true,
    runValidators:    true,
  });

  res.json({ success: true, user });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    throw new AppError('Mot de passe actuel incorrect', 401);
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id);
  res.json({ success: true, message: 'Mot de passe mis à jour', token });
});
