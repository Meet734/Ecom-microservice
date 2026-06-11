import { cleanEnv, str, port, num, bool } from 'envalid';

const env = cleanEnv(process.env, {
  NODE_ENV:             str({ choices: ['development', 'production', 'test'], default: 'development' }),
  PORT:                 port({ default: 3003 }),
  GRPC_PORT:            port({ default: 50051 }),

  DB_HOST:              str({ default: '127.0.0.1' }),
  DB_PORT:              num({ default: 5432 }),
  DB_NAME:              str({ default: 'ecomm_product_db' }),
  DB_USER:              str({ default: 'admin' }),
  DB_PASSWORD:          str({ default: 'password123' }),

  REDIS_HOST:           str({ default: '127.0.0.1' }),
  REDIS_PORT:           num({ default: 6379 }),
  REDIS_PASSWORD:       str({ default: '' }),
  REDIS_PRODUCT_TTL:    num({ default: 300 }),  // 5 minutes

  ELASTICSEARCH_URL:    str({ default: 'http://localhost:9200' }),

  JWT_ACCESS_SECRET:    str({ default: 'dev_access_secret_super_secure_key_12345' }),
  ALLOWED_ORIGINS:      str({ default: 'http://localhost:3000' }),
});

export default env;