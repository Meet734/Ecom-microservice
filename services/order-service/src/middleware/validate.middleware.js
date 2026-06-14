import Joi from 'joi';

const schemas = {
    // POST /api/orders — place a new order
    createOrder: Joi.object({
        items: Joi.array()
            .items(
                Joi.object({
                    product_id: Joi.string().uuid().required(),
                    quantity:   Joi.number().integer().min(1).max(100).required(),
                })
            )
            .min(1)
            .max(20)
            .required(),

        // Either provide an existing address_id from user-service OR a full inline address
        address_id: Joi.string().uuid().optional(),

        shipping_address: Joi.object({
            full_name: Joi.string().max(200).required(),
            phone:     Joi.string().max(20).required(),
            line1:     Joi.string().max(255).required(),
            line2:     Joi.string().max(255).allow('', null).optional(),
            city:      Joi.string().max(100).required(),
            state:     Joi.string().max(100).required(),
            pincode:   Joi.string().max(10).required(),
            country:   Joi.string().max(100).default('India'),
        }).optional(),

        notes: Joi.string().max(500).allow('', null).optional(),
    }).or('address_id', 'shipping_address'),   // at least one must be provided

    // PATCH /api/orders/:orderId/status — admin status update
    updateStatus: Joi.object({
        status: Joi.string()
            .valid('confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
            .required(),
        tracking_id:        Joi.string().max(100).optional(),
        estimated_delivery: Joi.string().max(100).optional(),
        cancelled_reason:   Joi.string().max(500).optional(),
    }),

    // POST /api/orders/:orderId/cancel — customer cancel
    cancelOrder: Joi.object({
        reason: Joi.string().max(500).allow('', null).optional(),
    }),
};

export const validate = (schemaName) => (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) return next();

    const { error, value } = schema.validate(req.body, {
        abortEarly:   false,
        stripUnknown: true,
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

    req.body = value;
    next();
};
