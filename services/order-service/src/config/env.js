import { cleanEnv, str, port, num } from 'envalid';

const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
    PORT: port({ default: 3004 }),

    // PostgreSQL
    DB_HOST: str({ default: '127.0.0.1' }),
    DB_PORT: num({ default: 5432 }),
    DB_NAME: str({ default: 'ecomm_order_db' }),
    DB_USER: str({ default: 'admin' }),
    DB_PASSWORD: str({ default: 'password123' }),

    // RabbitMQ
    RABBITMQ_URL: str({ default: 'amqp://guest:guest@localhost:5672' }),

    // JWT — used for verifying incoming requests
    JWT_ACCESS_SECRET: str({ default: 'dev_access_secret_super_secure_key_12345' }),

    // gRPC — address of the product-service gRPC server
    PRODUCT_GRPC_HOST: str({ default: 'localhost' }),
    PRODUCT_GRPC_PORT: num({ default: 50051 }),

    // Proto file path — volume-mounted in docker
    PROTO_PATH: str({ default: '../../../../proto/product.proto' }),

    // Internal service URLs (for REST calls)
    USER_SERVICE_URL: str({ default: 'http://localhost:3002' }),
    INVENTORY_SERVICE_URL: str({ default: 'http://localhost:3005' }),

    ALLOWED_ORIGINS: str({ default: 'http://localhost:3000' }),
});

export default env;
