import { getChannel } from '../config/rabbitmq.js';

const EXCHANGE = 'payment.events';

const publish = async (routingKey, payload) => {
    try {
        const channel = getChannel();
        await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

        channel.publish(
            EXCHANGE,
            routingKey,
            Buffer.from(JSON.stringify(payload)),
            { persistent: true, contentType: 'application/json' }
        );

        console.log(`[Payment Publisher] Published ${routingKey} for orderId=${payload.orderId}`);
    } catch (err) {
        console.error(`[Payment Publisher] Failed to publish ${routingKey}:`, err.message);
    }
};

/**
 * Consumed by:
 *   - order-service → marks order as paid, transitions to confirmed, decrements inventory
 *   - notification-service → sends payment confirmation email
 */
export const publishPaymentSuccess = (payload) =>
    publish('payment.success', payload);

/**
 * Option to publish failures if needed by consumers
 */
export const publishPaymentFailed = (payload) =>
    publish('payment.failed', payload);
