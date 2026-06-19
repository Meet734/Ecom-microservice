import { getChannel } from '../config/rabbitmq.js';
import { handlePaymentSuccess } from '../services/order.service.js';

const EXCHANGE = 'payment.events';
const QUEUE = 'order-service.payment.events';
const ROUTING_KEY = 'payment.success';

export const startConsumer = async () => {
    try {
        const channel = getChannel();

        // Ensure exchange exists
        await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

        // Ensure DLX for order payment failure inspection exists
        await channel.assertExchange('dlx.payment.events', 'topic', { durable: true });

        // Assert order payment events queue
        const { queue } = await channel.assertQueue(QUEUE, {
            durable: true,
            arguments: { 'x-dead-letter-exchange': 'dlx.payment.events' }
        });

        // Bind queue to the routing key
        await channel.bindQueue(queue, EXCHANGE, ROUTING_KEY);

        channel.prefetch(1);
        console.log(`[Order Consumer] Listening on exchange=${EXCHANGE}, routingKey=${ROUTING_KEY}`);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const payload = JSON.parse(msg.content.toString());
                console.log(`[Order Consumer] Processing payment event:`, payload);

                await handlePaymentSuccess(payload);

                channel.ack(msg);
                console.log(`[Order Consumer] Successfully processed payment event for orderId=${payload.orderId}`);
            } catch (err) {
                console.error(`[Order Consumer] Failed to process message:`, err.message);
                // Nack without requeue -> routes to DLX for manual inspection
                channel.nack(msg, false, false);
            }
        });
    } catch (err) {
        console.error(`[Order Consumer] Startup failure:`, err.message);
        throw err;
    }
};
