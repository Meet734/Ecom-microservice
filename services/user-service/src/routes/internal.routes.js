import { Router } from 'express';
import * as controller from '../controllers/user.controller.js';

const router = Router();

router.get('/addresses/:addressId', controller.getAddressInternal);

export default router;