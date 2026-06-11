import 'dotenv/config';
import env from './src/config/env.js';
import { connectRabbitMQ } from './src/config/rabbitmq.js';
import { startConsumer } from './src/events/consumer.js';

// Notification service has no HTTP server.
// It's a pure background worker. This is intentional and clean.

const start = async () => {
  await connectRabbitMQ();
  await startConsumer();

  console.log('[Notification Service] Running — waiting for events');
};

start();