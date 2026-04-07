/**
 * Routes Devis — Flux complet Architecte ↔ Artisan
 *
 * @swagger
 * tags:
 *   name: Quotes
 *   description: Gestion des devis entre architectes et artisans
 */
import express from 'express';
import {
  createQuote, getMyQuotes, getQuoteById,
  submitQuote, acceptQuote, refuseQuote,
} from '../controllers/quote.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // Toutes les routes devis nécessitent une authentification

router.route('/')
  .get(getMyQuotes)
  .post(authorize('Architecte', 'Ingenieur'), createQuote);

router.get('/:id', getQuoteById);
router.put('/:id/submit', authorize('Artisan'), submitQuote);
router.put('/:id/accept', authorize('Architecte', 'Ingenieur'), acceptQuote);
router.put('/:id/refuse', authorize('Architecte', 'Ingenieur'), refuseQuote);

export default router;
