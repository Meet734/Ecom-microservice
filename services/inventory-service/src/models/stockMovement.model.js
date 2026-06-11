import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Inventory from './inventory.model.js';

// Audit log of stock changes
const StockMovement = sequelize.define('stock_movements', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    inventory_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'inventory', key: 'id' },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('restock', 'sale', 'return', 'adjustment', 'reservation', 'release'),
      allowNull: false,
    },
    quantity_change: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity_after: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reference_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
}, {
    indexes: [
      { fields: ['inventory_id'] },
      { fields: ['type'] },
      { fields: ['reference_id'] },
    ],
});

Inventory.hasMany(StockMovement, { foreignKey: 'inventory_id', as: 'movements' });
StockMovement.belongsTo(Inventory, { foreignKey: 'inventory_id', as: 'inventory' });

export default StockMovement;