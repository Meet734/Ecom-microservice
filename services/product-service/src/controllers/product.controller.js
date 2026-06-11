import * as productService from '../services/product.service.js';

export const createCategory = async (req, res, next) => {
  try {
    const category = await productService.createCategory(req.body);
    return res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await productService.getCategories();
    return res.status(200).json({ success: true, data: categories });
  } catch (err) { next(err); }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct({
      ...req.body,
      seller_id: req.user.userId,
    });
    return res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return res.status(200).json({ success: true, data: product });
  } catch (err) { next(err); }
};

export const listProducts = async (req, res, next) => {
  try {
    const { category_id, page, limit, sort } = req.query;
    const result = await productService.listProducts({
      category_id,
      page:  parseInt(page)  || 1,
      limit: parseInt(limit) || 20,
      sort,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const searchProducts = async (req, res, next) => {
  try {
    const { q, category, min_price, max_price, page, limit } = req.query;
    const result = await productService.searchProductsCatalog({
      query:    q,
      category,
      minPrice: min_price ? parseInt(min_price) : undefined,
      maxPrice: max_price ? parseInt(max_price) : undefined,
      page:     parseInt(page)  || 1,
      limit:    parseInt(limit) || 20,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.user);
    return res.status(200).json({ success: true, data: product });
  } catch (err) { next(err); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id, req.user);
    return res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};