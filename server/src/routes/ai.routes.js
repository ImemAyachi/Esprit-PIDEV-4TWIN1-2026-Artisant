import express from 'express';
import { createProjectPlan } from '../controllers/aiProjectPlan.controller.js';

const router = express.Router();

// POST /api/ai/project-plan
router.post('/project-plan', createProjectPlan);

export default router;

