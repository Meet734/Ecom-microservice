import { Op } from 'sequelize';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import { indexProduct, removeProduct, searchProducts } from '../search/elasticsearch.service.js';

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const createCategory = async ({ name, description, parent_id }) => {
  const slug = slugify(name);

  const existing = await Category.findOne({ where: { [Op.or]: [{ name }, { slug }] } });
  if (existing) {
    const err = new Error('Category already exists');
    err.statusCode = 409;
    throw err;
  }

  return Category.create({ name, slug, description, parent_id });
};

export const getCategories = async () => {
  return Category.findAll({
    where: { is_active: true },
    order: [['name', 'ASC']],
  });
};

export const deleteCategory = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  // Soft-delete — keeps historical product references intact
  await category.update({ is_active: false });
  return { message: 'Category deactivated successfully' };
};

export const createProduct = async (data) => {
  const slug = slugify(data.name);

  const existing = await Product.findOne({ where: { [Op.or]: [{ slug }, { sku: data.sku }] } });
  if (existing) {
    const err = new Error('Product with this name or SKU already exists');
    err.statusCode = 409;
    throw err;
  }

  const product = await Product.create({ ...data, slug });
  await indexProduct(product);
  return product;
};

export const getProductById = async (id) => {
  const product = await Product.findByPk(id, {
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
  });

  if (!product || !product.is_active) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  return product;
};

export const getProductForOrder = async (id) => {
  const product = await Product.findOne({
    where: { id, is_active: true },
    attributes: ['id', 'name', 'price', 'sku', 'seller_id'],
  });

  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  return product;
};

export const listProducts = async ({ category_id, seller_id, page = 1, limit = 20, sort = 'created_at' }) => {
  const where = { is_active: true };
  if (category_id) where.category_id = category_id;
  if (seller_id) where.seller_id = seller_id;

  const offset = (page - 1) * limit;
  const order = sort.startsWith('-')
    ? [[sort.slice(1), 'DESC']]
    : [[sort, 'ASC']];

  const { rows: products, count: total } = await Product.findAndCountAll({
    where,
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
    order,
    limit,
    offset,
  });

  return {
    data: products,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

export const searchProductsCatalog = searchProducts;

export const updateProduct = async (id, updates, user) => {
  const product = await Product.findByPk(id);

  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'seller' && product.seller_id !== user.userId) {
    const err = new Error('Insufficient permissions');
    err.statusCode = 403;
    throw err;
  }

  if (updates.name) {
    updates.slug = slugify(updates.name);
  }

  await product.update(updates);
  await indexProduct(product);
  return product;
};

export const deleteProduct = async (id, user) => {
  const product = await Product.findByPk(id);

  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'seller' && product.seller_id !== user.userId) {
    const err = new Error('Insufficient permissions');
    err.statusCode = 403;
    throw err;
  }

  await product.update({ is_active: false });
  await removeProduct(id);
  return { message: 'Product deleted successfully' };
};
