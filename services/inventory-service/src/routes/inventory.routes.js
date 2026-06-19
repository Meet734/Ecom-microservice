import { Router } from 'express';
import * as controller from '../controllers/inventory.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// Read: any authenticated user can check stock availability
router.get('/:productId', authenticate, controller.getInventory);

// Write: admin and seller
router.post('/', authenticate, authorize('admin', 'seller'), validate('initializeInventory'), controller.initializeInventory);
router.post('/:productId/restock', authenticate, authorize('admin', 'seller'), validate('restock'), controller.restock);

export default router;