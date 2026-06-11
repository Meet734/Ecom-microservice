import { getChannel } from '../config/rabbitmq.js';
import Profile from '../models/profile.model.js';

const EXCHANGE = 'auth.events';
const QUEUE = 'user-service.auth.events';
const BINDING_KEYS = ['user.registered', 'user.deactivated'];

export const startConsumer = async () => {
    const channel = getChannel();

    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    const { queue } = await channel.assertQueue(QUEUE, {
        durable: true,
        arguments: {
            'x-dead-letter-exchange': 'dlx.auth.events',
        },
    });

    for (const key of BINDING_KEYS) {
        await channel.bindQueue(queue, EXCHANGE, key);
    }

    channel.prefetch(1);

    console.log(`[Consumer] Listening on exchange="${EXCHANGE}" keys=${BINDING_KEYS.join(',')}`);

    channel.consume(queue, async (msg) => {
        if (!msg) return;

        try {
            const content = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;

            console.log(`[Consumer] Received event: ${routingKey}`, content);

            await handleEvent(routingKey, content);

            channel.ack(msg);
        } catch (err) {
            console.error('[Consumer] Failed to process message:', err.message);

            channel.nack(msg, false, false);
        }
    });
};

const handleEvent = async (routingKey, payload) => {
    switch (routingKey) {
        case 'user.registered':
            return handleUserRegistered(payload);
        case 'user.deactivated':
            return handleUserDeactivated(payload);
        default:
            console.warn(`[Consumer] No handler for event: ${routingKey}`);
    }
};

const handleUserRegistered = async ({ userId, email }) => {
    const existing = await Profile.findOne({ where: { auth_user_id: userId } });
    if (existing) {
        console.log(`[Consumer] Profile already exists for userId=${userId}, skipping`);
        return;
    }

    await Profile.create({ auth_user_id: userId });
    console.log(`[Consumer] Profile created for userId=${userId}`);
};

const handleUserDeactivated = async ({ userId }) => {
    await Profile.update(
        { is_active: false },
        { where: { auth_user_id: userId } }
    );
    console.log(`[Consumer] Profile deactivated for userId=${userId}`);
};