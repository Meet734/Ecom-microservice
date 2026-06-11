import * as inventoryService from '../services/inventory.service.js';

// Controllers

export const initializeInventory = async (req, res, next) => {
  try {
    const { productId, quantity, low_stock_threshold, warehouse_location } = req.body;
    const inventory = await inventoryService.initializeInventory(productId, quantity, {
      low_stock_threshold,
      warehouse_location,
    });
    return res.status(201).json({ success: true, data: inventory });
  } catch (err) { next(err); }
};

export const getInventory = async (req, res, next) => {
  try {
    const inventory = await inventoryService.getInventory(req.params.productId);
    return res.status(200).json({ success: true, data: inventory });
  } catch (err) { next(err); }
};

export const restock = async (req, res, next) => {
  try {
    const { quantity, notes } = req.body;
    const inventory = await inventoryService.restock(req.params.productId, quantity, notes);
    return res.status(200).json({ success: true, data: inventory });
  } catch (err) { next(err); }
};

export const checkAvailability = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.query;
    const result = await inventoryService.checkAvailability(productId, parseInt(quantity) || 1);
    return res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};