import express from 'express';
import {
  register,
  login,
  getMe,
  toggleWishlist,
  getWishlist,
  addSavedAddress,
  deleteSavedAddress,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const authLimiter = rateLimiter({ windowMs: 60 * 1000, max: 30, message: 'Too many requests. Please slow down.' });

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);

// Wishlist
router.post('/wishlist/:productId', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);

// Address Book
router.post('/addresses', protect, addSavedAddress);
router.delete('/addresses/:addressId', protect, deleteSavedAddress);

export default router;
