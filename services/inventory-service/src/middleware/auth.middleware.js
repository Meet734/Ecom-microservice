import env from '../config/env.js';
import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    try {
        // Support API Gateway header injection (same pattern as user/product services)
        const gatewayUserId = req.headers['x-user-id'];
        const gatewayRole   = req.headers['x-user-role'];
        const gatewayEmail  = req.headers['x-user-email'];

        if (gatewayUserId) {
            req.user = { userId: gatewayUserId, role: gatewayRole, email: gatewayEmail };
            return next();
        }

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authorization header missing or malformed',
            });
        }

        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

        // Normalize to the same shape as user-service and product-service
        req.user = {
            userId: decoded.sub,
            email:  decoded.email,
            role:   decoded.role,
        };

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};

export const authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
};
