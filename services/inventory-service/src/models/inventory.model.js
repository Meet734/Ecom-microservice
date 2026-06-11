import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Inventory = sequelize.define('inventory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    reserved_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    low_stock_threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    warehouse_location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
}, {
    indexes: [
      { fields: ['product_id'] },
    ],
});

export default Inventory;