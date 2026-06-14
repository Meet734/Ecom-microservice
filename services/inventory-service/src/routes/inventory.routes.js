import { Router } from 'express';
import * as controller from '../controllers/inventory.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// Read: any authenticated user can check stock availability
router.get('/:productId', authenticate, controller.getInventory);

// Write: admin only
router.post('/', authenticate, authorize('admin'), validate('initializeInventory'), controller.initializeInventory);
router.post('/:productId/restock', authenticate, authorize('admin'), validate('restock'), controller.restock);

export default router;