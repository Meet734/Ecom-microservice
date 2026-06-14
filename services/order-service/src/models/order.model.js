import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// Order status lifecycle:
// pending → confirmed → processing → shipped → delivered
//         ↘ cancelled (from pending or confirmed)
const Order = sequelize.define('orders', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        // References auth-service user. No FK across DBs — application-level reference.
        type: DataTypes.UUID,
        allowNull: false,
    },
    user_email: {
        // Denormalized — copied at order creation to avoid cross-service calls on every email
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
    },
    // Snapshot of shipping address at time of order — never rely on user-service live data
    shipping_address: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: 'Address snapshot: { full_name, phone, line1, line2, city, state, pincode, country }',
    },
    // All amounts in paise/cents (INTEGER) — no floating point issues
    subtotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Sum of all item totals in paise',
    },
    shipping_charge: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Shipping fee in paise',
    },
    total_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'subtotal + shipping_charge in paise',
    },
    payment_status: {
        type: DataTypes.ENUM('unpaid', 'paid', 'refunded'),
        allowNull: false,
        defaultValue: 'unpaid',
    },
    payment_id: {
        // Set by payment-service after successful payment
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    cancelled_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    shipped_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    indexes: [
        { fields: ['user_id'] },
        { fields: ['status'] },
        { fields: ['payment_status'] },
        { fields: ['created_at'] },
    ],
});

export default Order;
