import { getChannel } from '../config/rabbitmq.js';
import { decrementStock, incrementStock } from '../services/inventory.service.js';

const EXCHANGE = 'order.events';
const QUEUE = 'inventory-service.order.events';
const KEYS = ['order.confirmed', 'order.cancelled'];

export const startConsumer = async () => {
  const channel = getChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  const { queue } = await channel.assertQueue(QUEUE, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': 'dlx.order.events' },
  });

  for (const key of KEYS) {
    await channel.bindQueue(queue, EXCHANGE, key);
  }

  channel.prefetch(1);
  console.log(`[Inventory Consumer] Listening on keys=${KEYS.join(',')}`);
  channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      console.log(`[Inventory Consumer] Event: ${routingKey}`, content);
      await handleEvent(routingKey, content);
      channel.ack(msg);
    } catch (err) {
      console.error('[Inventory Consumer] Error:', err.message);
      channel.nack(msg, false, false);
    }
  });
};

const handleEvent = async (routingKey, payload) => {
  switch (routingKey) {
    case 'order.confirmed':
      return handleOrderConfirmed(payload);
    case 'order.cancelled':
      return handleOrderCancelled(payload);
  }
};

const handleOrderConfirmed = async ({ orderId, items }) => {
  for (const item of items) {
    await decrementStock(item.productId, item.quantity, orderId);
    console.log(`[Inventory] Decremented ${item.quantity} units of ${item.productId} for order ${orderId}`);
  }
};

const handleOrderCancelled = async ({ orderId, items }) => {
  for (const item of items) {
    await incrementStock(item.productId, item.quantity, orderId, 'return');
    console.log(`[Inventory] Returned ${item.quantity} units of ${item.productId} for cancelled order ${orderId}`);
  }
};