import express from 'express';
import { createProjectPlan } from '../controllers/aiProjectPlan.controller.js';
import { aiFeatureProtect } from '../middleware/aiFeatureAuth.middleware.js';
import { createTextTo2dPlan } from '../controllers/textTo2dPlan.controller.js';
import { createPlan2dRender } from '../controllers/textTo2dRender.controller.js';
import { estimatePlan2dTnd } from '../controllers/plan2dEstimate.controller.js';
import { suggestPlan2dStyles } from '../controllers/plan2dStyleSuggest.controller.js';

const router = express.Router();

router.post('/project-plan', createProjectPlan);

router.post('/plan-2d', aiFeatureProtect, createTextTo2dPlan);

router.post('/plan-2d/render', aiFeatureProtect, createPlan2dRender);

router.post('/plan-2d/estimate', aiFeatureProtect, estimatePlan2dTnd);

router.post('/plan-2d/style-suggest', aiFeatureProtect, suggestPlan2dStyles);

export default router;
