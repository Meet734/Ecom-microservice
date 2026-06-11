import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const authenticate = async (req, res, next) => {
    try {
        const gatewayUserId = req.headers['x-user-id'];
        const gatewayRole = req.headers['x-user-role'];
        const gatewayEmail = req.headers['x-user-email'];

        if (gatewayUserId) {
            req.user = { userId: gatewayUserId, role: gatewayRole, email: gatewayEmail };
            return next();
        }

        const authHeader = req.headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authorization required' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

        req.user = {
            userId: decoded.sub,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

export const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
};