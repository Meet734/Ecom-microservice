// Identical pattern to auth-service — reuse confidently
import { createClient } from 'redis';
import env from './env.js';

const redisClient = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error('Redis max retries exceeded');
      return Math.min(retries * 100, 3000);
    },
  },
  password: env.REDIS_PASSWORD || undefined,
});

redisClient.on('connect',      () => console.log('[Redis] Product service connected'));
redisClient.on('error',    (e) => console.error('[Redis] Error:', e.message));
redisClient.on('reconnecting', () => console.log('[Redis] Reconnecting...'));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('[Redis] Initial connection failed:', err.message);
    process.exit(1);
  }
};

export default redisClient;