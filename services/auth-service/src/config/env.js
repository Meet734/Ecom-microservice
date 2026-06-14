import { cleanEnv, str, port, num } from 'envalid';

const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
    PORT: port({ default: 3001 }),

    // PostgreSQL - Mapped to match our active docker-compose setup safely
    DB_HOST: str({ default: '127.0.0.1' }),
    DB_PORT: num({ default: 5432 }),
    DB_NAME: str({ default: 'ecomm_db' }),
    DB_USER: str({ default: 'admin' }),
    DB_PASSWORD: str({ default: 'password123' }),

    // Redis
    REDIS_HOST: str({ default: '127.0.0.1' }),
    REDIS_PORT: num({ default: 6379 }),
    REDIS_PASSWORD: str({ default: '' }),

    // JWT
    JWT_ACCESS_SECRET: str({ default: 'dev_access_secret_super_secure_key_12345' }),
    JWT_REFRESH_SECRET: str({ default: 'dev_refresh_secret_super_secure_key_67890' }),
    JWT_ACCESS_EXPIRY:  str({ default: '15m' }),
    JWT_REFRESH_EXPIRY: str({ default: '7d' }),
    JWT_REFRESH_EXPIRY_MS: num({ default: 7 * 24 * 60 * 60 * 1000 }),

    // Bcrypt
    BCRYPT_ROUNDS: num({ default: 12 }),

    // RabbitMQ
    RABBITMQ_URL: str({ default: 'amqp://guest:guest@localhost:5672' }),
});

export default env;