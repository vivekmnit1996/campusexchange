import express from 'express';
import {
  createRequest,
  getBuyerRequests,
  getSellerRequests,
  getRequestById,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  completeRequest,
} from '../controllers/requestController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate, purchaseRequestSchema } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.post('/', validate(purchaseRequestSchema), createRequest);
router.get('/buyer', getBuyerRequests);
router.get('/seller', getSellerRequests);
router.get('/mine', getBuyerRequests); // compatibility alias
router.get('/seller-requests', getSellerRequests); // compatibility alias
router.get('/:id', getRequestById);
router.patch('/:id/accept', acceptRequest);
router.patch('/:id/reject', rejectRequest);
router.patch('/:id/cancel', cancelRequest);
router.patch('/:id/complete', completeRequest);

export default router;
