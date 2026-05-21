import * as authService  from '../services/auth.service.js';
import * as tokenService from '../services/token.service.js';
import User from '../models/user.model.js';

// Helpers

const getMeta = (req) => ({
    deviceInfo: req.headers['user-agent'] || null,
    ipAddress:  req.ip || req.headers['x-forwarded-for'] || null,
});

const sendTokens = (res, statusCode, data) => {
    const { refreshToken, ...rest } = data;

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge:   7*24 * 60*60 * 1000,  // 7 days
    });

    return res.status(statusCode).json({
        success: true,
        ...rest,
    });
};

// Controllers

export const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body, getMeta(req));
        return sendTokens(res, 201, result);
    } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body, getMeta(req));
        return sendTokens(res, 200, result);
    } catch (err) { next(err); }
};

export const refresh = async (req, res, next) => {
    try {
        const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!rawToken) {
        return res.status(401).json({ success: false, message: 'Refresh token missing' });
        }

        const userId = await tokenService.rotateRefreshToken(rawToken, getMeta(req));
        const user   = await User.findByPk(userId);

        if (!user || !user.is_active) {
        return res.status(401).json({ success: false, message: 'User not found or inactive' });
        }

        const accessToken  = tokenService.generateAccessToken({
        userId: user.id,
        email:  user.email,
        role:   user.role,
        });
        const refreshToken = tokenService.generateRefreshToken();
        await tokenService.storeRefreshToken(user.id, refreshToken, getMeta(req));

        return sendTokens(res, 200, {
        user: { id: user.id, email: user.email, role: user.role },
        accessToken,
        refreshToken,
        });
    } catch (err) { next(err); }
};

export const logout = async (req, res, next) => {
    try {
        const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;

        if (rawToken) await tokenService.revokeRefreshToken(rawToken);

        const authHeader = req.headers['authorization'];
        if (authHeader?.startsWith('Bearer ')) {
        await tokenService.blacklistAccessToken(authHeader.split(' ')[1]);
        }

        res.clearCookie('refreshToken');
        return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) { next(err); }
};

export const logoutAll = async (req, res, next) => {
    try {
        await tokenService.revokeAllRefreshTokens(req.user.userId);

        const authHeader = req.headers['authorization'];
        if (authHeader?.startsWith('Bearer ')) {
        await tokenService.blacklistAccessToken(authHeader.split(' ')[1]);
        }

        res.clearCookie('refreshToken');
        return res.status(200).json({ success: true, message: 'Logged out from all devices' });
    } catch (err) { next(err); }
};

export const verify = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token   = authHeader.split(' ')[1];
        const decoded = await tokenService.verifyAccessToken(token);

        return res.status(200).json({
        success: true,
        user: {
            userId: decoded.sub,
            email:  decoded.email,
            role:   decoded.role,
            jti:    decoded.jti,
        }
        });
    } catch (err) { next(err); }
};

export const me = async (req, res, next) => {
    try {
        return res.status(200).json({ success: true, user: req.user });
    } catch (err) { next(err); }
};

export const changePassword = async (req, res, next) => {
    try {
        const result = await authService.changePassword(req.user.userId, req.body);
        res.clearCookie('refreshToken');
        return res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
};