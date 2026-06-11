import { Router } from 'express';
import * as controller from '../controllers/inventory.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.post('/', authenticate, authorize('admin'), validate('initializeInventory'), controller.initializeInventory);
router.get('/:productId', authenticate, authorize('admin'), controller.getInventory);
router.post('/:productId/restock', authenticate, authorize('admin'), validate('restock'), controller.restock);

export default router;