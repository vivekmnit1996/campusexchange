import express from 'express';
import { getStoreBySlug, getAllStores } from '../controllers/storeController.js';

const router = express.Router();

router.get('/', getAllStores);
router.get('/:identifier', getStoreBySlug);

export default router;
