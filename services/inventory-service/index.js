import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { connectRabbitMQ } from './src/config/rabbitmq.js';
import { startConsumer } from './src/events/consumer.js';
import inventoryRoutes from './src/routes/inventory.routes.js';
import internalRoutes from './src/routes/internal.routes.js';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/internal', internalRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok', service: 'inventory-service' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(`[Inventory Error] ${err.message}`, err.stack);
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;
  return res.status(statusCode).json({ success: false, message });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

const start = async () => {
  await connectDB();
  await connectRabbitMQ();
  await startConsumer();
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[Inventory Service] Running on port ${env.PORT}`);
  });
};

start();