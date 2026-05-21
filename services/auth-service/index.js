import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import env from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { connectRedis } from './src/config/redis.js';
import authRoutes from './src/routes/auth.routes.js';

const app = express();

// Security Middleware
app.use(helmet()); // sets secure HTTP headers
app.use(cors({
    origin:      process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    credentials: true, // required for cookies to work cross-origin
}));

// Parsing
app.use(express.json({ limit: '10kb' })); // body size limit
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'auth-service' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[Auth Error] ${err.message}`, err.stack);

    const statusCode = err.statusCode || 500;
    const message    = statusCode === 500 ? 'Internal server error' : err.message;

    return res.status(statusCode).json({
        success: false,
        message,
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Startup
const start = async () => {
    await connectDB();
    await connectRedis();

    app.listen(env.PORT, () => {
        console.log(`[Auth Service] Running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
};

start();