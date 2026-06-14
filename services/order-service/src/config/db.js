import { Sequelize } from 'sequelize';
import env from './env.js';

const sequelize = new Sequelize(
    env.DB_NAME,
    env.DB_USER,
    env.DB_PASSWORD,
    {
        host: env.DB_HOST,
        port: env.DB_PORT,
        dialect: 'postgres',
        logging: env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: true,
            underscored: true,   // snake_case columns — consistent with all other services
            freezeTableName: true,
        },
    }
);

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('[Order DB] PostgreSQL connected');
        await sequelize.sync({ alter: env.NODE_ENV === 'development' });
        console.log('[Order DB] Models synchronized');
    } catch (err) {
        console.error('[Order DB] CONNECTION CRASHED:', err.message);
        process.exit(1);
    }
};

export default sequelize;
