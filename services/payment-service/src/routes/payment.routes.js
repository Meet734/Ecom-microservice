import { Router } from 'express';
import Joi from 'joi';
import * as controller from '../controllers/payment.controller.js';

const router = Router();

// Schemas
const checkoutSchema = Joi.object({
    order_id: Joi.string().guid({ version: 'uuidv4' }).required(),
    amount: Joi.number().integer().positive().required(), // paise
    card_number: Joi.string().creditCard().required(),
    card_expiry: Joi.string().pattern(/^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/).required(), // MM/YY or MM/YYYY
    card_cvv: Joi.string().pattern(/^[0-9]{3,4}$/).required(),
});

// Inline validation middleware
const validateCheckout = (req, res, next) => {
    const { error, value } = checkoutSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.details.map(d => ({
                field: d.path.join('.'),
                message: d.message,
            })),
        });
    }

    req.body = value;
    next();
};

// Routes
router.post('/', validateCheckout, controller.processPayment);
router.get('/history', controller.getPaymentHistory);
router.get('/order/:orderId', controller.getPaymentByOrderId);

export default router;
