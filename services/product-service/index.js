import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { connectRedis } from './src/config/redis.js';
import { connectElasticsearch } from './src/config/elasticsearch.js';
import { startGrpcServer } from './src/grpc/product.server.js';
import productRoutes from './src/routes/product.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.ALLOWED_ORIGINS.split(','), credentials: true }));
app.use(express.json({ limit: '10kb' }));

app.use('/api/products', productRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'product-service' });
});

app.use((err, req, res, next) => {
  console.error(`[Product Error] ${err.message}`);
  const statusCode = err.statusCode || 500;
  const message    = statusCode === 500 ? 'Internal server error' : err.message;
  return res.status(statusCode).json({ success: false, message });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const start = async () => {
  await connectDB();
  await connectRedis();
  await connectElasticsearch();
  startGrpcServer(); // gRPC on port 50051

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[Product Service] HTTP on port ${env.PORT}, gRPC on port ${env.GRPC_PORT}`);
  });
};

start();