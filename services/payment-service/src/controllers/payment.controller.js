import Payment from '../models/payment.model.js';
import { publishPaymentSuccess, publishPaymentFailed } from '../events/publisher.js';
import env from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

export const processPayment = async (req, res, next) => {
    try {
        const { order_id, amount, card_number, card_expiry, card_cvv } = req.body;
        const userId = req.headers['x-user-id'];
        const userEmail = req.headers['x-user-email'];
        const userRole = req.headers['x-user-role'];

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // 1. Fetch order details from order-service to validate
        let order;
        try {
            const orderRes = await fetch(`${env.ORDER_SERVICE_URL}/api/orders/${order_id}`, {
                headers: {
                    'x-user-id': userId,
                    'x-user-role': userRole,
                    'x-user-email': userEmail,
                }
            });

            if (!orderRes.ok) {
                const errorText = await orderRes.text();
                return res.status(orderRes.status).json({
                    success: false,
                    message: `Failed to fetch order: ${errorText || orderRes.statusText}`
                });
            }

            const body = await orderRes.json();
            order = body.data || body;
        } catch (err) {
            console.error('[Payment Service] Error contacting order-service:', err.message);
            return res.status(502).json({ success: false, message: 'Could not contact Order Service' });
        }

        // 2. Validate Order state
        if (order.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Cannot pay for a cancelled order' });
        }
        if (order.payment_status === 'paid') {
            return res.status(400).json({ success: false, message: 'Order has already been paid' });
        }
        if (order.total_amount !== amount) {
            return res.status(400).json({
                success: false,
                message: `Payment amount (${amount}) does not match order total (${order.total_amount})`
            });
        }

        // 3. Simulate Payment processor (e.g. Stripe checkout)
        const transactionId = 'ch_' + uuidv4().replace(/-/g, '').slice(0, 20);
        const cardLast4 = card_number.slice(-4);
        
        // Custom simulator: card number ending in '9999' or CVV '999' causes failure
        const isFailedCard = card_number.endsWith('9999') || card_cvv === '999';

        if (isFailedCard) {
            // Save failed transaction
            const failedPayment = await Payment.create({
                order_id,
                user_id: userId,
                amount,
                status: 'failed',
                transaction_id: transactionId,
                card_last4: cardLast4,
            });

            publishPaymentFailed({
                orderId: order_id,
                userId,
                amount,
                paymentId: failedPayment.id,
                userEmail,
                reason: 'Declined by simulator'
            });

            return res.status(402).json({
                success: false,
                message: 'Your payment was declined by the simulated card issuer.',
                data: failedPayment
            });
        }

        // Save successful transaction
        const payment = await Payment.create({
            order_id,
            user_id: userId,
            amount,
            status: 'completed',
            transaction_id: transactionId,
            card_last4: cardLast4,
        });

        // Publish event to RabbitMQ
        publishPaymentSuccess({
            orderId: order_id,
            userId,
            amount,
            paymentId: payment.id,
            userEmail,
        });

        return res.status(200).json({
            success: true,
            message: 'Payment processed successfully',
            data: payment
        });

    } catch (err) {
        next(err);
    }
};

export const getPaymentHistory = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const payments = await Payment.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
        });

        return res.status(200).json({ success: true, data: payments });
    } catch (err) {
        next(err);
    }
};

export const getPaymentByOrderId = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const query = { order_id: orderId };
        if (userRole !== 'admin') {
            query.user_id = userId;
        }

        const payment = await Payment.findOne({ where: query });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found for this order' });
        }

        return res.status(200).json({ success: true, data: payment });
    } catch (err) {
        next(err);
    }
};
