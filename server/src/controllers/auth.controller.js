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
import sendEmail from '../utils/mailer.js';

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

  // ── Vérification Email (OTP au moment de l'inscription) ───────────────
  const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.twoFactorCode = twoFactorCode;
  user.twoFactorExpire = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  console.log(`\n\n🔑 CODE D'INSCRIPTION POUR ${user.email} : ${twoFactorCode}\n\n`);

  try {
    await sendEmail({
      email: user.email,
      subject: 'Code de confirmation de votre inscription',
      message: `Bienvenue sur Artisanet,\n\nVotre code pour activer votre compte est : ${twoFactorCode}\n\nCe code est valide pendant 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4a5d23;">Bienvenue sur Artisanet !</h2>
          <p>Bonjour ${user.firstName},</p>
          <p>Pour finaliser votre inscription, veuillez saisir le code de vérification suivant :</p>
          <div style="font-size: 24px; font-weight: bold; background: #f3f4f6; text-align: center; padding: 15px; letter-spacing: 5px; border-radius: 4px; color: #333;">
            ${twoFactorCode}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">Ce code expirera dans 10 minutes.</p>
        </div>
      `
    });
  } catch (err) {}

  res.status(201).json({
    success: true,
    require2FA: true,
    email: user.email,
    message: 'Un code de confirmation a été envoyé à votre e-mail.',
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

  // Si on a laissé le champ twoFactorCode au moment de l'inscription et qu'il force le login
  if (user.twoFactorCode) {
    throw new AppError('Veuillez d\'abord valider votre e-mail avec le code reçu lors de l\'inscription.', 403);
  }

  // Mettre à jour lastLogin
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.json({
    success: true,
    token,
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      avatar: user.avatar,
      craft: user.craft,
      rating: user.rating,
    },
  });
});

/**
 * @swagger
 * /auth/verify-2fa:
 *   post:
 *     summary: Vérifier le code 2FA et obtenir le token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string }
 *               code:  { type: string }
 */
export const verify2FA = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    throw new AppError('Email et code de vérification requis', 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('Utilisateur introuvable', 404);
  }

  // Vérifier le code et l'expiration
  if (user.twoFactorCode !== code) {
    throw new AppError('Code de vérification incorrect', 400);
  }

  if (Date.now() > user.twoFactorExpire) {
    throw new AppError('Ce code a expiré. Veuillez vous reconnecter pour en recevoir un nouveau.', 400);
  }

  // Code valide : on le retire et on connecte l'utilisateur
  user.twoFactorCode = undefined;
  user.twoFactorExpire = undefined;
  
  // Mettre à jour lastLogin
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.json({
    success: true,
    token,
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      avatar: user.avatar,
      craft: user.craft,
      rating: user.rating,
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
  const forbidden = ['password', 'role', 'email', 'isVerified', 'isActive', 'rating'];
  forbidden.forEach((field) => delete req.body[field]);

  // Nettoyage des données pour éviter les erreurs d'enum (ex: si craft est renvoyé vide par un non-artisan)
  if (req.body.craft === '') delete req.body.craft;
  if (!req.body.firstName) delete req.body.firstName; // Ne pas vider si requis
  if (!req.body.lastName) delete req.body.lastName;

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

/**
 * Upload d'avatar utilisateur (via Multer + Cloudinary)
 */
export const uploadAvatarController = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Aucun fichier reçu', 400);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: req.file.path }, // Multer-storage-cloudinary remplit req.file.path avec l'URL Cloudinary
    { new: true }
  );

  res.json({ success: true, user });
});
