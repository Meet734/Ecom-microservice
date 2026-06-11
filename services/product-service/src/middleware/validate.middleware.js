import Joi from 'joi';

const schemas = {
  createCategory: Joi.object({
    name:        Joi.string().max(100).required(),
    description: Joi.string().max(500).optional(),
    parent_id:   Joi.string().uuid().optional(),
  }),

  createProduct: Joi.object({
    name:          Joi.string().max(255).required(),
    description:   Joi.string().optional(),
    price:         Joi.number().integer().min(1).required(),
    compare_price: Joi.number().integer().min(1).optional(),
    sku:           Joi.string().max(100).required(),
    brand:         Joi.string().max(100).optional(),
    images:        Joi.array().items(Joi.string().uri()).max(10).default([]),
    attributes:    Joi.object().default({}),
    category_id:   Joi.string().uuid().required(),
  }),

  updateProduct: Joi.object({
    name:          Joi.string().max(255).optional(),
    description:   Joi.string().optional(),
    price:         Joi.number().integer().min(1).optional(),
    compare_price: Joi.number().integer().min(1).allow(null).optional(),
    brand:         Joi.string().max(100).optional(),
    images:        Joi.array().items(Joi.string().uri()).max(10).optional(),
    attributes:    Joi.object().optional(),
    is_active:     Joi.boolean().optional(),
  }),
};

export const validate = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];
  if (!schema) return next();

  const { error, value } = schema.validate(req.body, {
    abortEarly: false, stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors:  error.details.map(d => ({ field: d.path.join('.'), message: d.message })),
    });
  }

  req.body = value;
  next();
};