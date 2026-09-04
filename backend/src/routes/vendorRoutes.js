import express from 'express';
import {
  getVendorDashboard,
  getVendorSubOrders,
  updateSubOrderStatus,
} from '../controllers/vendorController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('vendor', 'admin'));

router.get('/dashboard', getVendorDashboard);
router.get('/sub-orders', getVendorSubOrders);
router.patch('/orders/:orderId/sub-orders/:subOrderId', updateSubOrderStatus);

export default router;
