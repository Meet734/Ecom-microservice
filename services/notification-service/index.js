import 'dotenv/config';
import express from 'express';
import env from './src/config/env.js';
import { connectRabbitMQ } from './src/config/rabbitmq.js';
import { startConsumer } from './src/events/consumer.js';
import { initMailer } from './src/config/mailer.js';

const start = async () => {
  await initMailer();
  await connectRabbitMQ();
  await startConsumer();

  const app = express();

  app.get('/health', (req, res) => {
    res.status(200).json({ success: true, status: 'up' });
  });

  app.listen(env.PORT, () => {
    console.log(`[Notification Service] Running on port ${env.PORT} — waiting for events`);
  });
};

start();