import express from 'express';
import { createProjectPlan } from '../controllers/aiProjectPlan.controller.js';
import { aiFeatureProtect } from '../middleware/aiFeatureAuth.middleware.js';
import { createTextTo2dPlan } from '../controllers/textTo2dPlan.controller.js';
import { createPlan2dRender } from '../controllers/textTo2dRender.controller.js';

const router = express.Router();

router.post('/project-plan', createProjectPlan);

router.post('/plan-2d', aiFeatureProtect, createTextTo2dPlan);

router.post('/plan-2d/render', aiFeatureProtect, createPlan2dRender);

export default router;
