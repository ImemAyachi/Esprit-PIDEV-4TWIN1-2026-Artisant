/**
 * Routes Auth
 *
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentification et gestion de compte
 */
import express from 'express';
import { body } from 'express-validator';
import { register, login, verify2FA, getMe, updateMe, updatePassword, uploadAvatarController } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadAvatar } from '../middleware/upload.middleware.js';

const router = express.Router();

// Règles de validation pour l'inscription
const registerRules = [
  body('firstName').notEmpty().trim().withMessage('Prénom requis'),
  body('lastName').notEmpty().trim().withMessage('Nom requis'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe min 8 caractères'),
  body('role').isIn(['Architecte', 'Ingenieur', 'Fournisseur', 'Artisan']).withMessage('Rôle invalide'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
];

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/verify-2fa',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Le code doit contenir 6 chiffres')
  ],
  validate,
  verify2FA
);

// Routes protégées
router.use(protect);
router.get('/me',              getMe);
router.put('/me',              updateMe);
router.put('/me/avatar',       uploadAvatar.single('avatar'), uploadAvatarController);
router.put('/me/password',     updatePassword);

export default router;
