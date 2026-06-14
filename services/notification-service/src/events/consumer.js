import { getChannel } from '../config/rabbitmq.js';
import { handleUserRegistered } from '../handlers/userRegistered.js';
import { handleOrderConfirmed }  from '../handlers/orderConfirmed.js';
import { handleOrderCancelled }  from '../handlers/orderCancelled.js';
import { handleOrderShipped }    from '../handlers/orderShipped.js';
import { handlePaymentSuccess }  from '../handlers/paymentSuccess.js';

/**
 * All events this service listens to.
 *
 * exchange    — RabbitMQ topic exchange name
 * dlxName     — dead-letter exchange (must be asserted before the queue)
 * queue       — durable queue name (unique per service per event)
 * routingKey  — topic binding key
 * handler     — async function(payload) → sends email
 */
const SUBSCRIPTIONS = [
  {
    exchange:   'auth.events',
    dlxName:    'dlx.auth.events',
    queue:      'notification-service.auth.user-registered',
    routingKey: 'user.registered',
    handler:    handleUserRegistered,
  },
  {
    exchange:   'order.events',
    dlxName:    'dlx.order.events',
    queue:      'notification-service.order.confirmed',
    routingKey: 'order.confirmed',
    handler:    handleOrderConfirmed,
  },
  {
    exchange:   'order.events',
    dlxName:    'dlx.order.events',
    queue:      'notification-service.order.cancelled',
    routingKey: 'order.cancelled',
    handler:    handleOrderCancelled,
  },
  {
    exchange:   'order.events',
    dlxName:    'dlx.order.events',
    queue:      'notification-service.order.shipped',
    routingKey: 'order.shipped',
    handler:    handleOrderShipped,
  },
  {
    exchange:   'payment.events',
    dlxName:    'dlx.payment.events',
    queue:      'notification-service.payment.success',
    routingKey: 'payment.success',
    handler:    handlePaymentSuccess,
  },
];

export const startConsumer = async () => {
  const channel = getChannel();

  // Assert all exchanges and their dead-letter counterparts first
  const exchangesSeen = new Set();
  for (const sub of SUBSCRIPTIONS) {
    if (!exchangesSeen.has(sub.exchange)) {
      await channel.assertExchange(sub.exchange, 'topic', { durable: true });
      await channel.assertExchange(sub.dlxName,  'topic', { durable: true });
      exchangesSeen.add(sub.exchange);
    }
  }

  // Assert queues, bind, then consume
  for (const sub of SUBSCRIPTIONS) {
    const { queue } = await channel.assertQueue(sub.queue, {
      durable:   true,
      arguments: { 'x-dead-letter-exchange': sub.dlxName },
    });

    await channel.bindQueue(queue, sub.exchange, sub.routingKey);

    channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const payload    = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        console.log(`[Notification] Processing: ${routingKey}`, {
          orderId: payload.orderId,
          email:   payload.email || payload.userEmail,
        });

        await sub.handler(payload);
        channel.ack(msg);
      } catch (err) {
        console.error(`[Notification] Failed to handle ${sub.routingKey}:`, err.message);
        // nack without requeue → routes to DLX for manual inspection
        channel.nack(msg, false, false);
      }
    });
  }

  // One global prefetch — process one message at a time across all queues
  channel.prefetch(1);

  console.log(
    '[Notification Consumer] Listening on:',
    SUBSCRIPTIONS.map((s) => `${s.exchange}/${s.routingKey}`).join(', ')
  );
};
