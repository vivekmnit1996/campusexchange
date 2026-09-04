import express from 'express';
import { createOrder, getMyOrders, getOrderById, cancelOrder } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { idempotencyMiddleware } from '../middleware/idempotencyMiddleware.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const orderLimiter = rateLimiter({ windowMs: 60 * 1000, max: 30, message: 'Checkout rate limit reached.' });

router.post('/', protect, orderLimiter, idempotencyMiddleware, createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/cancel', protect, cancelOrder);

export default router;
