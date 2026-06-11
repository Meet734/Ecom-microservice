import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Category = sequelize.define('categories', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  name: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    unique:    true,
  },
  slug: {
    // URL-friendly identifier: "electronics", "mens-clothing"
    type:      DataTypes.STRING(100),
    allowNull: false,
    unique:    true,
  },
  description: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  parent_id: {
    // Self-referencing for nested categories (Electronics > Laptops)
    type:       DataTypes.UUID,
    allowNull:  true,
    references: { model: 'categories', key: 'id' },
    onDelete:   'SET NULL',
  },
  is_active: {
    type:         DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  indexes: [{ fields: ['slug'] }],
});

// Self-join for nested categories
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'subcategories' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

export default Category;