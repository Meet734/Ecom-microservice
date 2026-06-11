import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Category from './category.model.js';

const Product = sequelize.define('products', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  name: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    unique:    true,
  },
  description: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    // Store price in paise/cents to avoid floating point issues.
    // Interview question: "why INTEGER for price?" — this is the answer.
    type:      DataTypes.INTEGER,
    allowNull: false,
    comment:   'Price in smallest currency unit (paise/cents)',
  },
  compare_price: {
    // Original MRP for showing discount. NULL = no discount shown.
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  sku: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    unique:    true,
  },
  brand: {
    type:      DataTypes.STRING(100),
    allowNull: true,
  },
  images: {
    // Array of image URLs stored as JSONB — flexible, no joins needed
    type:         DataTypes.JSONB,
    defaultValue: [],
  },
  attributes: {
    // Flexible product attributes: { "color": "red", "size": "XL" }
    type:         DataTypes.JSONB,
    defaultValue: {},
  },
  category_id: {
    type:       DataTypes.UUID,
    allowNull:  false,
    references: { model: 'categories', key: 'id' },
  },
  is_active: {
    type:         DataTypes.BOOLEAN,
    defaultValue: true,
  },
  seller_id: {
    // References auth-service user with role 'seller'
    // No FK across DBs — application-level reference
    type:      DataTypes.UUID,
    allowNull: true,
  },
}, {
  indexes: [
    { fields: ['slug'] },
    { fields: ['category_id'] },
    { fields: ['seller_id'] },
    { fields: ['sku'] },
    { fields: ['is_active'] },
  ],
});

// Association
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

export default Product;