import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { connectRabbitMQ } from './src/config/rabbitmq.js';
import { startConsumer } from './src/events/consumer.js';
import userRoutes from './src/routes/user.routes.js';
import internalRoutes from './src/routes/internal.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
    origin: env.ALLOWED_ORIGINS.split(','),
    credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

app.use('/api/users', userRoutes);
app.use('/internal', internalRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'user-service' });
});

app.use((err, req, res, next) => {
    console.error(`[User Error] ${err.message}`);
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error' : err.message;

    return res.status(statusCode).json({ success: false, message });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

const start = async () => {
    await connectDB();
    await connectRabbitMQ();
    await startConsumer();

    app.listen(env.PORT, '0.0.0.0', () => {
        console.log(`[User Service] Running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
};

start();