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
        acquire: 30000,  // wait before throwing error
        idle: 10000   // before idle connection is released
        },
        define: {
        timestamps: true,
        underscored: true,   // snake_case column names
        freezeTableName: true
        }
    }
);

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('[Auth DB] PostgreSQL connected');

        await sequelize.sync({ alter: env.NODE_ENV === 'development' });
        console.log('[Auth DB] Models synchronized');
    } catch (err) {
        console.error('❌ [Auth DB] CONNECTION CRASHED!');
        console.error('--- START OF ERROR FULL OBJECT ---');
        console.error(err); // <-- CHANGE THIS: Print the entire object, not just err.message
        console.error('--- END OF ERROR FULL OBJECT ---');
        process.exit(1);
    }
};

export default sequelize;