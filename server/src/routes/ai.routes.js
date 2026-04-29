import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createProjectPlan } from '../controllers/aiProjectPlan.controller.js';
import { aiFeatureProtect } from '../middleware/aiFeatureAuth.middleware.js';
import { createTextTo2dPlan } from '../controllers/textTo2dPlan.controller.js';
import { createPlan2dRender } from '../controllers/textTo2dRender.controller.js';
import { runChantierBrain } from '../controllers/aiChantierBrain.controller.js';
import { recommendProducts } from '../controllers/aiProductRecommendation.controller.js';
import { generateVirtualStaging } from '../controllers/aiRenovation.controller.js';
import { estimatePlan2dTnd } from '../controllers/plan2dEstimate.controller.js';
import { suggestPlan2dStyles } from '../controllers/plan2dStyleSuggest.controller.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Multer: Store uploaded plan images temporarily ─────────────────────────
const tmpDir = path.join(__dirname, '../../tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `plan_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are accepted'));
  },
});

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
router.post('/recommend-products', recommendProducts); // Alias from HEAD

router.post('/project-plan', createProjectPlan);
router.post('/plan-2d', aiFeatureProtect, createTextTo2dPlan);
router.post('/plan-2d/render', aiFeatureProtect, createPlan2dRender);

// 🧠 Multi-Agent Construction Intelligence Engine
router.post('/chantier-brain', aiFeatureProtect, runChantierBrain);

// ── POST /api/ai/virtual-staging ──────────────────────────────────────────────
router.post('/virtual-staging', upload.single('image'), generateVirtualStaging);

// ── POST /api/ai/analyze-plan ─────────────────────────────────────────────────
// Accepts a multipart image upload. Runs plan_analyzer.py via Python/OpenCV.
// Returns a JSON with rooms and walls for the 3D renderer.
router.post('/analyze-plan', upload.single('plan'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No plan image uploaded' });
  }

  const imagePath = req.file.path;
  const scriptPath = path.join(__dirname, '../utils/plan_analyzer.py');
  console.log(`[AI Plan] Analyzing with OpenCV: ${imagePath}`);

  const pythonProcess = spawn('python', [scriptPath, imagePath], { encoding: 'utf-8' });
  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
  pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });

  pythonProcess.on('close', (code) => {
    try { fs.unlinkSync(imagePath); } catch (e) {}
    if (code !== 0) {
      console.error('[AI Plan] Python error:', stderr);
      return res.status(500).json({ error: 'Plan analysis failed', details: stderr });
    }
    try {
      const lines = stdout.trim().split('\n').filter(l => l.trim().startsWith('{'));
      if (lines.length === 0) throw new Error('No JSON output');
      const result = JSON.parse(lines[lines.length - 1]);
      console.log(`[AI Plan] Success: ${result.stats?.total_rooms} rooms, ${result.stats?.total_walls} walls`);
      res.json(result);
    } catch (e) {
      console.error('[AI Plan] JSON parse error:', e, 'stdout:', stdout);
      res.status(500).json({ error: 'Failed to parse analysis result' });
    }
  });

  pythonProcess.on('error', (err) => {
    try { fs.unlinkSync(imagePath); } catch (e) {}
    console.error('[AI Plan] Spawn error:', err);
    res.status(500).json({ error: 'Failed to start Python analyzer' });
  });
});

router.post('/plan-2d/estimate', aiFeatureProtect, estimatePlan2dTnd);
router.post('/plan-2d/style-suggest', aiFeatureProtect, suggestPlan2dStyles);
export default router;
