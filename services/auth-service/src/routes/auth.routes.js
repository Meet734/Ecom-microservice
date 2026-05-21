import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', validate('register'), controller.register);
router.post('/login', validate('login'), controller.login);
router.post('/refresh', validate('refresh'), controller.refresh);
router.get ('/verify', controller.verify);

// Semi-Public
router.post('/logout', controller.logout);

// Protected routes
router.post('/logout-all', authenticate, controller.logoutAll);
router.get ('/me', authenticate, controller.me);
router.put ('/change-password', authenticate, validate('changePassword'), controller.changePassword);

export default router;