import { Router } from 'express';
import * as controller from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// Public routes — no auth needed
router.get('/categories',      controller.getCategories);
router.get('/search',          controller.searchProducts);
router.get('/',                controller.listProducts);
router.get('/:id',             controller.getProduct);

// Protected: admin can create categories
router.post('/categories', authenticate, authorize('admin'), validate('createCategory'), controller.createCategory);

// Protected: sellers and admins can manage products
router.post('/',     authenticate, authorize('seller', 'admin'), validate('createProduct'), controller.createProduct);
router.put('/:id',   authenticate, authorize('seller', 'admin'), validate('updateProduct'), controller.updateProduct);
router.delete('/:id', authenticate, authorize('seller', 'admin'), controller.deleteProduct);

export default router;