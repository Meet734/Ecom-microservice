import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { connectRabbitMQ } from './src/config/rabbitmq.js';
import paymentRoutes from './src/routes/payment.routes.js';

// Import models to register them
import './src/models/payment.model.js';

const app = express();

app.use(helmet());
app.use(cors({
    origin: env.ALLOWED_ORIGINS.split(','),
    credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

// Base API route
app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'payment-service' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[Payment Error] ${err.message}`, err.stack);
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error' : err.message;
    return res.status(statusCode).json({ success: false, message });
});

// 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

const start = async () => {
    await connectDB();
    await connectRabbitMQ();

    app.listen(env.PORT, '0.0.0.0', () => {
        console.log(`[Payment Service] Running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
};

start();
