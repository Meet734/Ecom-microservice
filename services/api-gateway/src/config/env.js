import { cleanEnv, str, port } from 'envalid';

const env = cleanEnv(process.env, {
    NODE_ENV:              str({ choices: ['development', 'production', 'test'], default: 'development' }),
    PORT:                  port({ default: 8000 }),
    REDIS_HOST:            str({ default: 'localhost' }),
    REDIS_PORT:            port({ default: 6379 }),
    JWT_ACCESS_SECRET:     str({ default: 'changeme' }),
    ALLOWED_ORIGINS:       str({ default: 'http://localhost:3000' }),

    // Downstream services
    AUTH_SERVICE_URL:      str({ default: 'http://localhost:3001' }),
    USER_SERVICE_URL:      str({ default: 'http://localhost:3002' }),
    PRODUCT_SERVICE_URL:   str({ default: 'http://localhost:3003' }),
    ORDER_SERVICE_URL:     str({ default: 'http://localhost:3004' }),
    INVENTORY_SERVICE_URL: str({ default: 'http://localhost:3005' }),
    PAYMENT_SERVICE_URL:   str({ default: 'http://localhost:3006' }),
});

export default env;
