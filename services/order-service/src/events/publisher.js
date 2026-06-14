import { getChannel } from '../config/rabbitmq.js';

const EXCHANGE = 'order.events';

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

        console.log(`[Publisher] Published ${routingKey} for orderId=${payload.orderId}`);
    } catch (err) {
        // Publishing failure must not break the core order flow.
        // Log prominently — alert in production.
        console.error(`[Publisher] Failed to publish ${routingKey}:`, err.message);
    }
};

/**
 * Consumed by:
 *   - inventory-service → decrements stock for each item
 *   - notification-service → sends order confirmation email
 *
 * Payload shape must match both consumers exactly.
 */
export const publishOrderConfirmed = (payload) =>
    publish('order.confirmed', payload);

/**
 * Consumed by:
 *   - inventory-service → restores stock for each item
 */
export const publishOrderCancelled = (payload) =>
    publish('order.cancelled', payload);

/**
 * Consumed by:
 *   - notification-service → sends shipping notification email
 */
export const publishOrderShipped = (payload) =>
    publish('order.shipped', payload);
