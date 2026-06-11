import Joi from 'joi';

const schemas = {
    updateProfile: Joi.object({
        first_name: Joi.string().max(100).optional(),
        last_name: Joi.string().max(100).optional(),
        phone: Joi.string().max(20).optional(),
        avatar_url: Joi.string().uri().max(2048).optional(),
        date_of_birth: Joi.date().iso().max('now').optional(),
    }),

    addAddress: Joi.object({
        label: Joi.string().max(50).default('Home'),
        full_name: Joi.string().max(200).required(),
        phone: Joi.string().max(20).required(),
        line1: Joi.string().max(255).required(),
        line2: Joi.string().max(255).optional(),
        city: Joi.string().max(100).required(),
        state: Joi.string().max(100).required(),
        pincode: Joi.string().max(10).required(),
        country: Joi.string().max(100).default('India'),
        is_default: Joi.boolean().default(false),
    }),

    updateAddress: Joi.object({
        label: Joi.string().max(50).optional(),
        full_name: Joi.string().max(200).optional(),
        phone: Joi.string().max(20).optional(),
        line1: Joi.string().max(255).optional(),
        line2: Joi.string().max(255).allow(null, '').optional(),
        city: Joi.string().max(100).optional(),
        state: Joi.string().max(100).optional(),
        pincode: Joi.string().max(10).optional(),
        country: Joi.string().max(100).optional(),
        is_default: Joi.boolean().optional(),
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
            errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })),
        });
    }

    req.body = value;
    next();
};