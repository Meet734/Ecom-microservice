import Joi from 'joi';

const schemas = {
  initializeInventory: Joi.object({
    productId: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(0).required(),
    low_stock_threshold: Joi.number().integer().min(0).optional(),
    warehouse_location: Joi.string().max(100).optional(),
  }),

  restock: Joi.object({
    quantity: Joi.number().integer().min(1).required(),
    notes: Joi.string().max(500).optional(),
  }),
};

export const validate = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];
  if (!schema) return next();

  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      })),
    });
  }

  req.body = value;
  next();
};
