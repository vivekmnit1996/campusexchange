import express from 'express';
import { searchAI, getQuickPrompts, getHealth } from '../controllers/aiController.js';

const router = express.Router();

router.post('/search', searchAI);
router.post('/chat', searchAI);
router.get('/quick-prompts', getQuickPrompts);
router.get('/health', getHealth);

export default router;
