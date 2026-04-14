import express from 'express';
import { recommendProducts } from '../controllers/ai.controller.js';

const router = express.Router();

/**
 * @swagger
 * /ai/recommend:
 *   post:
 *     summary: Recommander des produits via IA
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               need:
 *                 type: string
 *                 example: "Je veux construire une salle de bain moderne"
 *     responses:
 *       200:
 *         description: Liste de recommandations
 *       500:
 *         description: Erreur serveur ou IA
 */
router.post('/recommend', recommendProducts);

export default router;
