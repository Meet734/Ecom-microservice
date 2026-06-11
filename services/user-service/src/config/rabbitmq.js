import amqp from 'amqplib';
import env from './env.js';

let connection = null;
let channel = null;

export const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(env.RABBITMQ_URL);
        channel = await connection.createChannel();

        console.log('[RabbitMQ] Connected');

        connection.on('close', () => {
            console.error('[RabbitMQ] Connection closed. Exiting for restart.');
            process.exit(1);
        });

        connection.on('error', (err) => {
            console.error('[RabbitMQ] Connection error:', err.message);
        });

        return channel;
    } catch (err) {
        console.error('[RabbitMQ] Failed to connect:', err.message);
        process.exit(1);
    }
};

export const getChannel = () => {
    if (!channel) throw new Error('RabbitMQ channel not initialized');
    return channel;
};