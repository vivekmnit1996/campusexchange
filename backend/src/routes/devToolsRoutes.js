import express from 'express';
import {
  simulateConcurrency,
  generateSignedWebhook,
  reseedDatabase,
} from '../controllers/devToolsController.js';

const router = express.Router();

router.post('/simulate-concurrency', simulateConcurrency);
router.post('/emit-webhook', generateSignedWebhook);
router.post('/reseed', reseedDatabase);

export default router;
