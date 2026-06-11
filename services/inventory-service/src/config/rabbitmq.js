import amqp from 'amqplib';
import env from './env.js';

let channel;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(env.RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('[Inventory Service] RabbitMQ connected successfully');
  } catch (err) {
    console.error('[Inventory Service] RabbitMQ connection failed:', err.message);
    process.exit(1);
  }
};

export const getChannel = () => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  return channel;
};
