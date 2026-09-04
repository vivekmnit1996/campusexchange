import express from 'express';
import { getPlatformAnalytics, getVendorAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/platform', authorize('admin'), getPlatformAnalytics);
router.get('/vendor', authorize('vendor', 'admin'), getVendorAnalytics);

export default router;
