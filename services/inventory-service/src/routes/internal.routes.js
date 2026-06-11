import { Router } from 'express';
import * as controller from '../controllers/inventory.controller.js';

const router = Router();

router.get('/availability/:productId', controller.checkAvailability);

export default router;