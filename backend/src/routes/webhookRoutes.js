import express from 'express';
import { handlePaymentWebhook, getWebhookLogs } from '../controllers/webhookController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public webhook ingress (Signature verified inside controller)
router.post('/payment', express.json({ type: '*/*' }), handlePaymentWebhook);

// Admin inspection logs
router.get('/logs', protect, authorize('admin'), getWebhookLogs);

export default router;
