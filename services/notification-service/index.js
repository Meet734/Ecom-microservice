import 'dotenv/config';
import env from './src/config/env.js';
import { connectRabbitMQ } from './src/config/rabbitmq.js';
import { startConsumer } from './src/events/consumer.js';
import { initMailer } from './src/config/mailer.js';

// Notification service has no HTTP server.
// It's a pure background worker. This is intentional and clean.

const start = async () => {
  await initMailer();
  await connectRabbitMQ();
  await startConsumer();

  console.log('[Notification Service] Running — waiting for events');
};

start();