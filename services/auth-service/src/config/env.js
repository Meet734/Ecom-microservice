import { cleanEnv, str, port, num } from 'envalid';

const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'production', 'test'] }),
    PORT: port({ default: 3001 }),

    // PostgreSQL
    DB_HOST: str(),
    DB_PORT: num({ default: 5432 }),
    DB_NAME: str(),
    DB_USER: str(),
    DB_PASSWORD: str(),

    // Redis
    REDIS_HOST: str(),
    REDIS_PORT: num({ default: 6379 }),
    REDIS_PASSWORD: str({ default: '' }),

    // JWT
    JWT_ACCESS_SECRET: str(),
    JWT_REFRESH_SECRET: str(),
    JWT_ACCESS_EXPIRY:  str({ default: '15m' }),
    JWT_REFRESH_EXPIRY: str({ default: '7d' }),
    JWT_REFRESH_EXPIRY_MS: num({ default: 7*24 * 60*60 * 1000 }),

    // Bcrypt
    BCRYPT_ROUNDS: num({ default: 12 }),
});

export default env;