import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyListings,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate, productSchema, productUpdateSchema } from '../middleware/validate.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/seller/me', protect, getMyListings);
router.get('/:id', getProductById);
router.post('/', protect, validate(productSchema), createProduct);
router.patch('/:id', protect, validate(productUpdateSchema), updateProduct);
router.put('/:id', protect, validate(productUpdateSchema), updateProduct);
router.delete('/:id', protect, deleteProduct);

export default router;
