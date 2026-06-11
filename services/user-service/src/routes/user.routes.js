import { Router } from 'express';
import * as controller from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/me', controller.getMyProfile);
router.put('/me', validate('updateProfile'), controller.updateMyProfile);

router.get('/me/addresses', controller.getMyAddresses);
router.post('/me/addresses', validate('addAddress'), controller.addAddress);
router.put('/me/addresses/:addressId', validate('updateAddress'), controller.updateAddress);
router.delete('/me/addresses/:addressId', controller.deleteAddress);

export default router;