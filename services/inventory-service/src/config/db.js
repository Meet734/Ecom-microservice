import { Sequelize } from 'sequelize';
import env from './env.js';

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'postgres',
  logging: env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  },
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('[Inventory Service] Database connected successfully');
    await sequelize.sync({ alter: env.NODE_ENV === 'development' });
  } catch (err) {
    console.error('[Inventory Service] Database connection failed:', err.message);
    process.exit(1);
  }
};

export default sequelize;
