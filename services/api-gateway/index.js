import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';

import env from './src/config/env.js';
import { connectRedis } from './src/config/redis.js';
import { extractUserContext } from './src/middleware/auth.middleware.js';

const app = express();

// Trust proxy (behind Docker/Gateway setups)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// CORS Settings
app.use(cors({
    origin: env.ALLOWED_ORIGINS.split(','),
    credentials: true,
}));

// Rate Limiter: 100 requests per minute per IP
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

// Redis Connection
await connectRedis();

// Extract authentication context and propagate via headers
app.use(extractUserContext);

// Proxy definitions helper
const makeProxy = (pathPrefix, targetUrl) => createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: (path, req) => {
        const rewritten = pathPrefix + path;
        console.log(`[Proxy Rewrite] originalUrl: ${req.originalUrl}, req.url: ${req.url}, path: ${path}, rewritten: ${rewritten}`);
        return rewritten;
    },
    onProxyReq: (proxyReq, req, res) => {
        // Explicitly propagate authentication headers injected by extractUserContext
        if (req.headers['x-user-id']) {
            proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
        }
        if (req.headers['x-user-role']) {
            proxyReq.setHeader('x-user-role', req.headers['x-user-role']);
        }
        if (req.headers['x-user-email']) {
            proxyReq.setHeader('x-user-email', req.headers['x-user-email']);
        }

        // Downstream services might check Content-Length for body parsing, so we write back the body
        if (req.body) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onError: (err, req, res) => {
        console.error(`[Gateway Proxy Error] target: ${targetUrl}, path: ${req.path}, error: ${err.message}`);
        res.status(502).json({ success: false, message: 'Service temporarily unavailable' });
    }
});

// Since proxying needs raw bodies to work smoothly for post requests,
// we apply the proxy middleware BEFORE express.json() for proxied routes.
// http-proxy-middleware handles raw streams perfectly this way.

app.use('/api/auth', makeProxy('/api/auth', env.AUTH_SERVICE_URL));
app.use('/api/users', makeProxy('/api/users', env.USER_SERVICE_URL));
app.use('/api/products', makeProxy('/api/products', env.PRODUCT_SERVICE_URL));
app.use('/api/orders', makeProxy('/api/orders', env.ORDER_SERVICE_URL));
app.use('/api/inventory', makeProxy('/api/inventory', env.INVENTORY_SERVICE_URL));
app.use('/api/payments', makeProxy('/api/payments', env.PAYMENT_SERVICE_URL));

// Parse body ONLY for native routes (if any are added to the gateway later)
app.use(express.json());

// 404 Route Not Found
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found at Gateway' });
});

app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[API Gateway] Running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
