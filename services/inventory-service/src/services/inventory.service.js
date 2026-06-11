import sequelize from '../config/db.js';
import { QueryTypes } from 'sequelize';
import Inventory from '../models/inventory.model.js';
import StockMovement from '../models/stockMovement.model.js';

// Inventory Management

export const initializeInventory = async (productId, quantity = 0, options = {}) => {
  const existing = await Inventory.findOne({ where: { product_id: productId } });
  if (existing) {
    const err = new Error('Inventory record already exists for this product');
    err.statusCode = 409;
    throw err;
  }

  const inventory = await Inventory.create({
    product_id: productId,
    quantity,
    low_stock_threshold: options.low_stock_threshold || 10,
    warehouse_location: options.warehouse_location || null,
  });

  await StockMovement.create({
    inventory_id: inventory.id,
    type: 'restock',
    quantity_change: quantity,
    quantity_after: quantity,
    notes: 'Initial stock',
  });

  return inventory;
};

export const getInventory = async (productId) => {
  const inventory = await Inventory.findOne({ where: { product_id: productId } });
  if (!inventory) {
    const err = new Error('Inventory not found for this product');
    err.statusCode = 404;
    throw err;
  }
  return inventory;
};

export const restock = async (productId, quantity, notes = '') => {
  return await sequelize.transaction(async (t) => {
    const inventory = await Inventory.findOne({
      where: { product_id: productId },
      lock: true,
      transaction: t,
    });

    if (!inventory) {
      const err = new Error('Inventory record not found');
      err.statusCode = 404;
      throw err;
    }

    const newQuantity = inventory.quantity + quantity;
    await inventory.update({ quantity: newQuantity }, { transaction: t });

    await StockMovement.create({
      inventory_id: inventory.id,
      type: 'restock',
      quantity_change: quantity,
      quantity_after: newQuantity,
      notes,
    }, { transaction: t });

    return inventory;
  });
};

// Stock Operations

export const decrementStock = async (productId, quantity, orderId) => {
  return await sequelize.transaction(async (t) => {
    const [rowsUpdated] = await sequelize.query(
      `UPDATE inventory
       SET quantity = quantity - :qty,
           updated_at = NOW()
       WHERE product_id = :productId
         AND quantity >= :qty`,
      {
        replacements: { qty: quantity, productId },
        type: QueryTypes.UPDATE,
        transaction: t,
      }
    );

    if (rowsUpdated === 0) {
      const err = new Error(`Insufficient stock for product ${productId}`);
      err.statusCode = 422;
      throw err;
    }

    const inventory = await Inventory.findOne({
      where: { product_id: productId },
      transaction: t,
    });

    await StockMovement.create({
      inventory_id: inventory.id,
      type: 'sale',
      quantity_change: -quantity,
      quantity_after: inventory.quantity,
      reference_id: orderId,
      notes: `Order ${orderId}`,
    }, { transaction: t });

    return inventory;
  });
};

export const incrementStock = async (productId, quantity, orderId, type = 'return') => {
  return await sequelize.transaction(async (t) => {
    const inventory = await Inventory.findOne({
      where: { product_id: productId },
      lock: true,
      transaction: t,
    });

    if (!inventory) {
      const err = new Error('Inventory record not found');
      err.statusCode = 404;
      throw err;
    }

    const newQuantity = inventory.quantity + quantity;
    await inventory.update({ quantity: newQuantity }, { transaction: t });

    await StockMovement.create({
      inventory_id: inventory.id,
      type,
      quantity_change: quantity,
      quantity_after: newQuantity,
      reference_id: orderId,
    }, { transaction: t });

    return inventory;
  });
};

export const checkAvailability = async (productId, requestedQty) => {
  const inventory = await Inventory.findOne({ where: { product_id: productId } });
  if (!inventory) return { available: false, reason: 'Product not tracked in inventory' };

  const available = inventory.quantity - inventory.reserved_quantity;
  return {
    available: available >= requestedQty,
    quantity: inventory.quantity,
    reserved: inventory.reserved_quantity,
    inStock: available,
    reason: available < requestedQty ? 'Insufficient stock' : null,
  };
};