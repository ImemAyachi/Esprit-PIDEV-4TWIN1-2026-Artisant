import express from 'express';
import { getWorkforceStats, matchWorkforce } from '../controllers/workforce.controller.js';

const router = express.Router();

// GET /api/workforce/stats
router.get('/stats', getWorkforceStats);

// POST /api/workforce/match
router.post('/match', matchWorkforce);

export default router;

