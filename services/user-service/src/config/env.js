import { cleanEnv, str, port, num } from 'envalid';

const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
    PORT: port({ default: 3002 }),

    DB_HOST: str({ default: '127.0.0.1' }),
    DB_PORT: num({ default: 5432 }),
    DB_NAME: str({ default: 'ecomm_user_db' }),
    DB_USER: str({ default: 'admin' }),
    DB_PASSWORD: str({ default: 'password123' }),

    RABBITMQ_URL: str({ default: 'amqp://guest:guest@localhost:5672' }),

    JWT_ACCESS_SECRET: str({ default: 'dev_access_secret_super_secure_key_12345' }),

    ALLOWED_ORIGINS: str({ default: 'http://localhost:3000' }),
});

export default env;