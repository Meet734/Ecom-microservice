import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import redisClient from '../config/redis.js';

export const extractUserContext = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
            // No token provided, proceed downstream without headers.
            // Downstream services will enforce auth if the route is protected.
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

        // Check if token is blacklisted in Redis (from logouts)
        const isBlacklisted = await redisClient.get(`blacklist:${decoded.jti}`);
        if (isBlacklisted) {
            return res.status(401).json({ success: false, message: 'Session revoked. Please log in again.' });
        }

        // Inject headers for downstream propagation
        req.headers['x-user-id'] = decoded.sub;
        req.headers['x-user-email'] = decoded.email;
        req.headers['x-user-role'] = decoded.role;

        next();
    } catch (err) {
        // Return 401 if a token was supplied but is invalid/expired
        return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
    }
};
