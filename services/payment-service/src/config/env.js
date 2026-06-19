import { cleanEnv, str, port } from 'envalid';

const env = cleanEnv(process.env, {
    NODE_ENV:          str({ choices: ['development', 'production', 'test'], default: 'development' }),
    PORT:              port({ default: 3006 }),
    DB_HOST:           str({ default: 'localhost' }),
    DB_PORT:           port({ default: 5432 }),
    DB_NAME:           str({ default: 'ecomm_payment_db' }),
    DB_USER:           str({ default: 'admin' }),
    DB_PASSWORD:       str({ default: 'changeme' }),
    RABBITMQ_URL:      str({ default: 'amqp://guest:guest@localhost:5672' }),
    ALLOWED_ORIGINS:   str({ default: 'http://localhost:3000' }),
    ORDER_SERVICE_URL: str({ default: 'http://localhost:3004' }),
});

export default env;
