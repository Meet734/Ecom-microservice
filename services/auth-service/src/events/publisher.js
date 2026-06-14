import { getChannel } from '../config/rabbitmq.js';

const EXCHANGE = 'auth.events';

export const publishUserRegistered = async ({ userId, email, role, name }) => {
  try {
    const channel = getChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    const message = Buffer.from(JSON.stringify({ userId, email, role, name, timestamp: new Date() }));

    channel.publish(EXCHANGE, 'user.registered', message, {
      persistent:   true,   // survive RabbitMQ restart
      contentType:  'application/json',
    });

    console.log(`[Publisher] user.registered published for userId=${userId}`);
  } catch (err) {
    // Publishing failure should not break the register flow
    // Log and continue — user is already created in DB
    console.error('[Publisher] Failed to publish user.registered:', err.message);
  }
};