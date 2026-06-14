import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import { publishUserRegistered } from '../events/publisher.js';
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  revokeAllRefreshTokens,
} from './token.service.js';
import env from '../config/env.js';

// Helpers

const buildTokenPair = async (user, meta = {}) => {
    const accessToken  = generateAccessToken({
        userId: user.id,
        email:  user.email,
        role:   user.role,
    });
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken, meta);

    return { accessToken, refreshToken };
};

const safeUser = (user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    is_verified: user.is_verified,
    created_at: user.created_at,
});

// Auth Operations

export const register = async ({ email, password, name, role = 'customer' }, meta = {}) => {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
        const err = new Error('Email already registered');
        err.statusCode = 409;
        throw err;
    }

    const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    const user   = await User.create({ email, password_hash, role });
    await publishUserRegistered({ userId: user.id, email: user.email, role: user.role, name });
    const tokens = await buildTokenPair(user, meta);

    return { user: safeUser(user), ...tokens };
};

export const login = async ({ email, password }, meta = {}) => {
    const user = await User.findOne({ where: { email } });

    const dummyHash = '$2b$12$invalidhashpaddingtomatchlength000000000000000000000000';
    const passwordMatch = await bcrypt.compare(
        password,
        user ? user.password_hash : dummyHash
    );

    if (!user || !passwordMatch) {
        const err = new Error('Invalid email or password');
        err.statusCode = 401;
        throw err;
    }

    if (!user.is_active) {
        const err = new Error('Account is deactivated');
        err.statusCode = 403;
        throw err;
    }

    const tokens = await buildTokenPair(user, meta);
    return { user: safeUser(user), ...tokens };
};

export const changePassword = async (userId, { oldPassword, newPassword }) => {
    const user = await User.findByPk(userId);
    if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        throw err;
    }

    const match = await bcrypt.compare(oldPassword, user.password_hash);
    if (!match) {
        const err = new Error('Current password is incorrect');
        err.statusCode = 401;
        throw err;
    }

    const password_hash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await user.update({ password_hash });

    await revokeAllRefreshTokens(userId);

    return { message: 'Password updated. Please login again.' };
};