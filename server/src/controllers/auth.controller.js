/**
 * Auth Controller — Inscription, connexion, profil
 *
 * POST /api/auth/register  — Inscription avec choix du rôle
 * POST /api/auth/login     — Connexion + génération JWT
 * GET  /api/auth/me        — Profil courant
 * PUT  /api/auth/me        — Mise à jour du profil
 */
import crypto from 'crypto';
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

  // Si l'utilisateur n'est pas encore vérifié (code 2FA présent)
  if (user.twoFactorCode) {
    // Si le code a expiré, on en génère un nouveau
    if (Date.now() > user.twoFactorExpire) {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.twoFactorCode = newCode;
      user.twoFactorExpire = Date.now() + 10 * 60 * 1000;
      await user.save({ validateBeforeSave: false });

      // On tente de renvoyer l'email
      try {
        await sendEmail({
          email: user.email,
          subject: 'Nouveau code de vérification',
          message: `Votre nouveau code est : ${newCode}`,
          html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #ddd;border-radius:8px;">
                  <h3>Nouveau code de vérification</h3>
                  <p>L'ancien code ayant expiré, voici votre nouveau code :</p>
                  <div style="font-size:24px;font-weight:bold;background:#f3f4f6;text-align:center;padding:15px;letter-spacing:5px;">${newCode}</div>
                </div>`
        });
      } catch (err) { console.error("Email resend failed:", err); }
      
      return res.status(403).json({
        success: false,
        message: 'Votre ancien code avait expiré. Un nouveau code a été envoyé à votre e-mail.',
        require2FA: true,
        email: user.email
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Veuillez d\'abord valider votre e-mail avec le code reçu lors de l\'inscription.',
      require2FA: true,
      email: user.email
    });
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
  const forbidden = ['password', 'role', 'email', 'isVerified', 'isActive', 'rating'];
  forbidden.forEach((field) => delete req.body[field]);

  if (req.body.craft === '') delete req.body.craft;
  if (!req.body.firstName) delete req.body.firstName;
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
 * POST /api/auth/forgot-password — envoie un lien de réinitialisation (réponse identique si l’email est inconnu)
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const generic =
    'Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.';

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ success: true, message: generic });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const baseUrl = (process.env.CLIENT_URL || 'http://localhost:5176').replace(/\/$/, '');
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

  const localhostHint =
    /localhost|127\.0\.0\.1/i.test(baseUrl)
      ? `
        <p style="color:#92400e;font-size:12px;border:1px solid #fcd34d;padding:12px;border-radius:8px;background:#fffbeb;margin-top:16px;">
          <strong>Lien « localhost » :</strong> il n’ouvre l’app que sur la machine où le front tourne (<code>npm run dev</code> dans <code>front/</code>).
          Depuis un téléphone ou un autre PC, définissez dans <code>server/.env</code> une URL joignable, par ex.
          <code>CLIENT_URL=http://192.168.x.x:5176</code> (IP de votre PC sur le réseau), puis relancez l’API et renvoyez un nouveau mail.
        </p>`
      : '';

  const sent = await sendEmail({
    email: user.email,
    subject: 'Réinitialisation de votre mot de passe — Artisanet',
    message: `Bonjour ${user.firstName},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valide 24 heures) :\n${resetUrl}\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #4a5d23;">Réinitialisation du mot de passe</h2>
        <p>Bonjour ${user.firstName},</p>
        <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe (lien valide 24 heures).</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#4a5d23;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Réinitialiser mon mot de passe</a></p>
        <p style="color:#666;font-size:12px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>${resetUrl}</p>
        ${localhostHint}
      </div>
    `,
  });

  if (!sent && process.env.NODE_ENV === 'development') {
    console.log('\n📧 SMTP indisponible — lien de reset (dev uniquement) :\n', resetUrl, '\n');
  }

  res.json({ success: true, message: generic });
});

/**
 * POST /api/auth/reset-password — définit un nouveau mot de passe via token reçu par e-mail
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const incoming = String(token ?? '').trim();
  if (!incoming) {
    throw new AppError('Lien incomplet. Demandez un nouveau lien.', 400);
  }

  const hashed = crypto.createHash('sha256').update(incoming).digest('hex');
  const now = Date.now();

  const user = await User.findOne({
    resetPasswordExpire: { $gt: now },
    $or: [{ resetPasswordToken: incoming }, { resetPasswordToken: hashed }],
  });

  if (!user) {
    throw new AppError(
      'Lien invalide, expiré ou déjà utilisé. Un nouveau mail « mot de passe oublié » annule l’ancien lien — demandez-en un nouveau si besoin.',
      400
    );
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Mot de passe mis à jour. Vous pouvez vous connecter.',
  });
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
