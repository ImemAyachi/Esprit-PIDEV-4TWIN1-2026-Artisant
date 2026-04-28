import express from 'express';
import { recommendProducts } from '../controllers/ai.controller.js';
import { createProjectPlan } from '../controllers/aiProjectPlan.controller.js';
import { aiFeatureProtect } from '../middleware/aiFeatureAuth.middleware.js';
import { createTextTo2dPlan } from '../controllers/textTo2dPlan.controller.js';
import { createPlan2dRender } from '../controllers/textTo2dRender.controller.js';
import { runChantierBrain } from '../controllers/aiChantierBrain.controller.js';
import { estimatePlan2dTnd } from '../controllers/plan2dEstimate.controller.js';
import { suggestPlan2dStyles } from '../controllers/plan2dStyleSuggest.controller.js';

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
router.post('/project-plan', createProjectPlan);
router.post('/plan-2d', aiFeatureProtect, createTextTo2dPlan);
router.post('/plan-2d/render', aiFeatureProtect, createPlan2dRender);

// 🧠 Multi-Agent Construction Intelligence Engine
router.post('/chantier-brain', aiFeatureProtect, runChantierBrain);

router.post('/plan-2d/estimate', aiFeatureProtect, estimatePlan2dTnd);
router.post('/plan-2d/style-suggest', aiFeatureProtect, suggestPlan2dStyles);

export default router;
