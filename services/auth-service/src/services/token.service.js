import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../config/redis.js';
import RefreshToken from '../models/refreshToken.model.js';
import env from '../config/env.js';

// Helpers

const hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');

// Access Token

export const generateAccessToken = (payload) => {
    return jwt.sign(
        {
        jti:   uuidv4(),
        sub:   payload.userId,
        email: payload.email,
        role:  payload.role,
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: env.JWT_ACCESS_EXPIRY }
    );
};

export const verifyAccessToken = async (token) => {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    const blacklisted = await redisClient.get(`blacklist:${decoded.jti}`);
    if (blacklisted) {
        throw new Error('Token has been revoked');
    }

    return decoded;
};

export const blacklistAccessToken = async (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded?.jti || !decoded?.exp) return;

        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
        await redisClient.setEx(`blacklist:${decoded.jti}`, ttl, '1');
        }
    } catch {
        // non critical
    }
};

// Refresh Token

export const generateRefreshToken = () => {
    return uuidv4() + crypto.randomBytes(32).toString('hex');
};

export const storeRefreshToken = async (userId, rawToken, meta = {}) => {
    const hash      = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRY_MS);

    await RefreshToken.create({
        user_id:     userId,
        token_hash:  hash,
        device_info: meta.deviceInfo || null,
        ip_address:  meta.ipAddress  || null,
        expires_at:  expiresAt,
    });
};

export const rotateRefreshToken = async (rawToken, meta = {}) => {
    const hash    = hashToken(rawToken);
    const stored  = await RefreshToken.findOne({ where: { token_hash: hash } });

    if (!stored)             throw new Error('Refresh token not found');
    if (stored.is_revoked)   throw new Error('Refresh token has been revoked');
    if (stored.expires_at < new Date()) throw new Error('Refresh token expired');

    // Revoke old token
    await stored.update({ is_revoked: true });

    return stored.user_id;
};

export const revokeRefreshToken = async (rawToken) => {
    const hash   = hashToken(rawToken);
    const stored = await RefreshToken.findOne({ where: { token_hash: hash } });
    if (stored) await stored.update({ is_revoked: true });
};

export const revokeAllRefreshTokens = async (userId) => {
    await RefreshToken.update(
        { is_revoked: true },
        { where: { user_id: userId, is_revoked: false } }
    );
};