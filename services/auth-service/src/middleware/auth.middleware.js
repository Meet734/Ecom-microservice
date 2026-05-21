import { verifyAccessToken } from '../services/token.service.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authorization header missing or malformed'
        });
        }

        const token = authHeader.split(' ')[1];
        const decoded = await verifyAccessToken(token);

        req.user = {
        userId: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        jti: decoded.jti,
        };

        next();
    } catch (err) {
        const isJwtError = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError']
        .includes(err.name);

        return res.status(401).json({
        success: false,
        message: isJwtError ? 'Invalid or expired token' : err.message,
        });
    }
};

// Role 
export const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
        return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        });
    }
    next();
};