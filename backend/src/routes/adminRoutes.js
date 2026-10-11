import express from 'express';
import {
  getUsers,
  deleteUser,
  getProducts,
  deleteProduct,
  getStats,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('ADMIN'));

router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.get('/products', getProducts);
router.delete('/products/:id', deleteProduct);
router.get('/stats', getStats);

export default router;
