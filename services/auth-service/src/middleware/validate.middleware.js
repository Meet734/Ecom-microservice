import Joi from 'joi';

// Schemas

const schemas = {
    register: Joi.object({
        email: Joi.string().email().max(255).required(),
        password: Joi.string().min(6).max(128).required(),
        role: Joi.string().valid('customer', 'seller').default('customer'),
        name: Joi.string().max(100).optional(),
    }),

    login: Joi.object({
        email:    Joi.string().email().required(),
        password: Joi.string().required(),
    }),

    changePassword: Joi.object({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().min(6).max(128).required(),
    }),

    refresh: Joi.object({
        refreshToken: Joi.string().optional(),
    }),
};

// Middleware Factory

export const validate = (schemaName) => (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) return next();

    const { error, value } = schema.validate(req.body, {
        abortEarly:    false,
        stripUnknown:  true,
    });

    if (error) {
        return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors:  error.details.map(d => ({
            field:   d.path.join('.'),
            message: d.message,
        })),
        });
    }

    req.body = value;  // replace body with sanitized, validated value
    next();
};