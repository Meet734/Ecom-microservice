import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Payment = sequelize.define('payments', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    order_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    amount: {
        type: DataTypes.INTEGER, // in paise/cents
        allowNull: false,
    },
    currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'INR',
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
    },
    transaction_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    card_last4: {
        type: DataTypes.STRING(4),
        allowNull: true,
    },
}, {
    indexes: [
        { fields: ['order_id'] },
        { fields: ['user_id'] },
        { fields: ['status'] },
        { fields: ['transaction_id'] },
    ],
});

export default Payment;
