import { getChannel } from '../config/rabbitmq.js';
import { handleOrderConfirmed } from '../handlers/orderConfirmed.js';
import { handlePaymentSuccess } from '../handlers/paymentSuccess.js';
import { handleOrderShipped }   from '../handlers/orderShipped.js';

// This service subscribes to multiple exchanges.
// It's a pure consumer — no DB, no HTTP server. Just events → emails.

const SUBSCRIPTIONS = [
  {
    exchange:   'order.events',
    queue:      'notification-service.order.events',
    routingKey: 'order.confirmed',
    handler:    handleOrderConfirmed,
  },
  {
    exchange:   'payment.events',
    queue:      'notification-service.payment.events',
    routingKey: 'payment.success',
    handler:    handlePaymentSuccess,
  },
  {
    exchange:   'order.events',
    queue:      'notification-service.order.shipped',
    routingKey: 'order.shipped',
    handler:    handleOrderShipped,
  },
];

export const startConsumer = async () => {
  const channel = getChannel();

  for (const sub of SUBSCRIPTIONS) {
    await channel.assertExchange(sub.exchange, 'topic', { durable: true });

    const { queue } = await channel.assertQueue(sub.queue, {
      durable:   true,
      arguments: { 'x-dead-letter-exchange': `dlx.${sub.exchange}` },
    });

    await channel.bindQueue(queue, sub.exchange, sub.routingKey);
  }

  channel.prefetch(1);

  console.log('[Notification Consumer] Listening on all subscriptions');

  // A single channel.consume per queue
  for (const sub of SUBSCRIPTIONS) {
    channel.consume(sub.queue, async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());
        console.log(`[Notification] Processing: ${sub.routingKey}`, { orderId: payload.orderId });

        await sub.handler(payload);
        channel.ack(msg);
      } catch (err) {
        console.error(`[Notification] Failed to handle ${sub.routingKey}:`, err.message);
        channel.nack(msg, false, false);
      }
    });
  }
};