import express from 'express';
import { chat } from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/chat
router.post('/', protect, chat);

export default router;
