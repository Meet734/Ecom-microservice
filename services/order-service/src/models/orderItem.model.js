import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Order from './order.model.js';

// Each row is one line item in an order.
// Product data is snapshotted at time of order — prices can change, we never want to recalculate.
const OrderItem = sequelize.define('order_items', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
    },
    product_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    seller_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    product_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    product_sku: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    unit_price: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
    },
    total_price: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    indexes: [
        { fields: ['order_id'] },
        { fields: ['product_id'] },
        { fields: ['seller_id'] },
    ],
});

// Associations
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

export default OrderItem;
