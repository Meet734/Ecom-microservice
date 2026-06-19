import { Router } from 'express';
import * as controller from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// ── Customer routes ────────────────────────────────────────────────────────

// Place a new order (items + shipping address)
router.post(
    '/',
    authenticate,
    authorize('customer', 'admin'),
    validate('createOrder'),
    controller.createOrder
);

// Get the authenticated user's order history (paginated)
router.get(
    '/',
    authenticate,
    authorize('customer', 'admin'),
    controller.getMyOrders
);

// Get a single order — customers can only see their own; admin can see any
router.get(
    '/:orderId',
    authenticate,
    authorize('customer', 'admin'),
    controller.getOrderById
);

// Confirm a pending order (moves to confirmed, triggers inventory + notification)
router.post(
    '/:orderId/confirm',
    authenticate,
    authorize('customer', 'admin'),
    controller.confirmOrder
);

// Cancel an order (pending or confirmed only)
router.post(
    '/:orderId/cancel',
    authenticate,
    authorize('customer', 'admin'),
    validate('cancelOrder'),
    controller.cancelOrder
);

// ── Seller routes ───────────────────────────────────────────────────────────

// Get seller statistics
router.get(
    '/seller/stats',
    authenticate,
    authorize('seller', 'admin'),
    controller.getSellerStats
);

// Get seller orders
router.get(
    '/seller/orders',
    authenticate,
    authorize('seller', 'admin'),
    controller.getSellerOrders
);

// ── Admin routes ───────────────────────────────────────────────────────────

// List all orders across all users (admin only)
router.get(
    '/admin/all',
    authenticate,
    authorize('admin'),
    controller.getAllOrders
);

// Admin status update (confirm, ship, deliver, cancel)
router.patch(
    '/:orderId/status',
    authenticate,
    authorize('admin'),
    validate('updateStatus'),
    controller.updateOrderStatus
);

export default router;
