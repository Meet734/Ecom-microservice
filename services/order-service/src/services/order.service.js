import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import Order from '../models/order.model.js';
import OrderItem from '../models/orderItem.model.js';
import { getProducts } from '../grpc/product.client.js';
import { publishOrderConfirmed, publishOrderCancelled, publishOrderShipped } from '../events/publisher.js';
import env from '../config/env.js';

// ---------------------------------------------------------------------------
// Internal helper — fetch shipping address from user-service if address_id given
// ---------------------------------------------------------------------------
const fetchShippingAddress = async (addressId) => {
    const url = `${env.USER_SERVICE_URL}/internal/addresses/${addressId}`;
    const res  = await fetch(url);

    if (!res.ok) {
        const err = new Error('Shipping address not found');
        err.statusCode = 404;
        throw err;
    }

    const body = await res.json();
    const addr = body.data;

    return {
        full_name: addr.full_name,
        phone:     addr.phone,
        line1:     addr.line1,
        line2:     addr.line2 || null,
        city:      addr.city,
        state:     addr.state,
        pincode:   addr.pincode,
        country:   addr.country,
    };
};

// ---------------------------------------------------------------------------
// Place a new order
// ---------------------------------------------------------------------------
export const createOrder = async (userId, userEmail, body) => {
    const { items, address_id, shipping_address, notes } = body;

    // 1. Resolve shipping address
    const resolvedAddress = address_id
        ? await fetchShippingAddress(address_id)
        : shipping_address;

    // 2. Fetch product data via gRPC (single round-trip, strongly typed)
    const productIds = items.map(i => i.product_id);
    const products   = await getProducts(productIds);

    // Build a lookup map for O(1) access
    const productMap = new Map(products.map(p => [p.id, p]));

    // 3. Validate all products exist, check stock, and compute totals
    const lineItems = [];
    for (const item of items) {
        const product = productMap.get(item.product_id);
        if (!product) {
            const err = new Error(`Product ${item.product_id} not found or inactive`);
            err.statusCode = 404;
            throw err;
        }

        // Validate stock with inventory-service
        const invUrl = `${env.INVENTORY_SERVICE_URL}/internal/availability/${item.product_id}?quantity=${item.quantity}`;
        try {
            const invRes = await fetch(invUrl);
            if (!invRes.ok) {
                const err = new Error(`Stock verification failed for product ${item.product_id}`);
                err.statusCode = 422;
                throw err;
            }
            const invData = await invRes.json();
            if (!invData.success || !invData.data?.available) {
                const err = new Error(`Insufficient stock for product "${product.name}". Available: ${invData.data?.inStock ?? 0}`);
                err.statusCode = 422;
                throw err;
            }
        } catch (fetchErr) {
            console.error('[Order Service] Stock check error:', fetchErr.message);
            const err = new Error(fetchErr.statusCode ? fetchErr.message : 'Inventory Service unreachable');
            err.statusCode = fetchErr.statusCode || 502;
            throw err;
        }

        lineItems.push({
            product_id:   item.product_id,
            product_name: product.name,
            product_sku:  product.sku,
            unit_price:   product.price,
            quantity:     item.quantity,
            total_price:  product.price * item.quantity,
            seller_id:    product.seller_id || null,
        });
    }

    const subtotal       = lineItems.reduce((sum, l) => sum + l.total_price, 0);
    const shipping_charge = subtotal >= 50000 ? 0 : 4900; // free shipping above ₹500
    const total_amount   = subtotal + shipping_charge;

    const order = await sequelize.transaction(async (t) => {
        const newOrder = await Order.create(
            {
                user_id:          userId,
                user_email:       userEmail,
                status:           'pending',
                shipping_address: resolvedAddress,
                subtotal,
                shipping_charge,
                total_amount,
                notes: notes || null,
            },
            { transaction: t }
        );

        await OrderItem.bulkCreate(
            lineItems.map(l => ({ ...l, order_id: newOrder.id })),
            { transaction: t }
        );

        return newOrder;
    });

    // 5. Reload with items included
    const fullOrder = await Order.findByPk(order.id, {
        include: [{ model: OrderItem, as: 'items' }],
    });

    return fullOrder;
};

// ---------------------------------------------------------------------------
// Confirm an order (moves pending → confirmed, triggers async pipeline)
// ---------------------------------------------------------------------------
export const confirmOrder = async (orderId, userId) => {
    const order = await Order.findOne({
        where: { id: orderId, user_id: userId },
        include: [{ model: OrderItem, as: 'items' }],
    });

    if (!order) {
        const err = new Error('Order not found');
        err.statusCode = 404;
        throw err;
    }

    if (order.status !== 'pending') {
        const err = new Error(`Cannot confirm order with status "${order.status}"`);
        err.statusCode = 422;
        throw err;
    }

    await order.update({ status: 'confirmed' });

    // Publish order.confirmed — consumed by inventory-service (stock decrement)
    // and notification-service (confirmation email)
    publishOrderConfirmed({
        orderId:         order.id,
        userEmail:       order.user_email,
        items:           order.items.map(i => ({
            productId: i.product_id,
            name:      i.product_name,
            quantity:  i.quantity,
            price:     i.unit_price,
        })),
        total:           order.total_amount,
        shippingAddress: order.shipping_address,
    });

    return order;
};

// ---------------------------------------------------------------------------
// Get orders for a specific user with pagination
// ---------------------------------------------------------------------------
export const getUserOrders = async (userId, { page = 1, limit = 10, status }) => {
    const where = { user_id: userId };
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { rows: orders, count: total } = await Order.findAndCountAll({
        where,
        include: [{ model: OrderItem, as: 'items' }],
        order: [['created_at', 'DESC']],
        limit:  parseInt(limit),
        offset,
    });

    return {
        data:  orders,
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
    };
};

// ---------------------------------------------------------------------------
// Get a single order (validates ownership)
// ---------------------------------------------------------------------------
export const getOrderById = async (orderId, userId, role) => {
    const where = { id: orderId };

    // Admin can fetch any order; customers can only fetch their own
    if (role !== 'admin') {
        where.user_id = userId;
    }

    const order = await Order.findOne({
        where,
        include: [{ model: OrderItem, as: 'items' }],
    });

    if (!order) {
        const err = new Error('Order not found');
        err.statusCode = 404;
        throw err;
    }

    return order;
};

// ---------------------------------------------------------------------------
// Cancel an order (customer can cancel pending/confirmed orders)
// ---------------------------------------------------------------------------
export const cancelOrder = async (orderId, userId, role, reason) => {
    const where = { id: orderId };
    if (role !== 'admin') where.user_id = userId;

    const order = await Order.findOne({
        where,
        include: [{ model: OrderItem, as: 'items' }],
    });

    if (!order) {
        const err = new Error('Order not found');
        err.statusCode = 404;
        throw err;
    }

    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
        const err = new Error(`Cannot cancel order with status "${order.status}". Only pending or confirmed orders can be cancelled.`);
        err.statusCode = 422;
        throw err;
    }

    // Capture status BEFORE mutation — order.update() changes the in-memory value
    const previousStatus = order.status;

    await order.update({
        status:           'cancelled',
        cancelled_reason: reason || null,
    });

    // Publish order.cancelled — consumed by inventory-service to restore stock.
    // Only publish if order was confirmed (stock was decremented).
    if (previousStatus === 'confirmed') {
        publishOrderCancelled({
            orderId: order.id,
            items:   order.items.map(i => ({
                productId: i.product_id,
                quantity:  i.quantity,
            })),
        });
    }

    return order;
};

// ---------------------------------------------------------------------------
// Admin: update order status with optional tracking information
// ---------------------------------------------------------------------------
export const updateOrderStatus = async (orderId, { status, tracking_id, estimated_delivery, cancelled_reason }) => {
    const order = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: 'items' }],
    });

    if (!order) {
        const err = new Error('Order not found');
        err.statusCode = 404;
        throw err;
    }

    const updates = { status };

    if (status === 'shipped') {
        updates.shipped_at = new Date();
    }

    if (status === 'delivered') {
        updates.delivered_at = new Date();
    }

    if (status === 'cancelled' && cancelled_reason) {
        updates.cancelled_reason = cancelled_reason;
    }

    await order.update(updates);

    // Emit events based on new status
    if (status === 'confirmed') {
        publishOrderConfirmed({
            orderId:         order.id,
            userEmail:       order.user_email,
            items:           order.items.map(i => ({
                productId: i.product_id,
                name:      i.product_name,
                quantity:  i.quantity,
                price:     i.unit_price,
            })),
            total:           order.total_amount,
            shippingAddress: order.shipping_address,
        });
    }

    if (status === 'shipped') {
        publishOrderShipped({
            orderId:           order.id,
            userEmail:         order.user_email,
            trackingId:        tracking_id || 'N/A',
            estimatedDelivery: estimated_delivery || 'TBD',
        });
    }

    if (status === 'cancelled') {
        publishOrderCancelled({
            orderId: order.id,
            items:   order.items.map(i => ({
                productId: i.product_id,
                quantity:  i.quantity,
            })),
        });
    }

    return order;
};

// ---------------------------------------------------------------------------
// Admin: get all orders with filters and pagination
// ---------------------------------------------------------------------------
export const getAllOrders = async ({ page = 1, limit = 20, status, user_id }) => {
    const where = {};
    if (status)  where.status  = status;
    if (user_id) where.user_id = user_id;

    const offset = (page - 1) * limit;

    const { rows: orders, count: total } = await Order.findAndCountAll({
        where,
        include: [{ model: OrderItem, as: 'items' }],
        order: [['created_at', 'DESC']],
        limit:  parseInt(limit),
        offset,
    });

    return {
        data:  orders,
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
    };
};

// ---------------------------------------------------------------------------
// Asynchronous background consumer: handle successful payment events
// ---------------------------------------------------------------------------
export const handlePaymentSuccess = async ({ orderId, paymentId }) => {
    const order = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: 'items' }],
    });

    if (!order) {
        throw new Error(`Order ${orderId} not found during payment.success event handling`);
    }

    // Update payment details
    await order.update({
        payment_status: 'paid',
        payment_id:     paymentId,
    });

    console.log(`[Order Service] Order ${orderId} marked as paid`);

    // If order was pending, confirm it and trigger downstream logic
    if (order.status === 'pending') {
        await order.update({ status: 'confirmed' });
        console.log(`[Order Service] Order ${orderId} transitioned pending -> confirmed`);

        publishOrderConfirmed({
            orderId:         order.id,
            userEmail:       order.user_email,
            items:           order.items.map(i => ({
                productId: i.product_id,
                name:      i.product_name,
                quantity:  i.quantity,
                price:     i.unit_price,
            })),
            total:           order.total_amount,
            shippingAddress: order.shipping_address,
        });
    }
};

// ---------------------------------------------------------------------------
// Seller: get stats and metrics for a specific seller
// ---------------------------------------------------------------------------
export const getSellerStats = async (sellerId) => {
    const items = await OrderItem.findAll({
        where: { seller_id: sellerId },
        include: [{
            model: Order,
            as: 'order',
            attributes: ['status', 'payment_status', 'total_amount']
        }]
    });

    let totalItems = 0;
    let totalRevenue = 0;
    const statusCounts = {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
    };

    const orderMap = new Map();

    for (const item of items) {
        totalItems += item.quantity;
        totalRevenue += item.total_price;
        
        const status = item.order?.status;
        if (status && statusCounts[status] !== undefined) {
            statusCounts[status] += 1;
        }

        if (item.order) {
            orderMap.set(item.order_id, item.order.status);
        }
    }

    const orderStatusCounts = {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
    };
    for (const status of orderMap.values()) {
        if (orderStatusCounts[status] !== undefined) {
            orderStatusCounts[status] += 1;
        }
    }

    return {
        totalItems,
        totalRevenue,
        totalOrders: orderMap.size,
        orderStatusCounts,
        itemStatusCounts: statusCounts
    };
};

// ---------------------------------------------------------------------------
// Seller: get paginated orders that contain the seller's products
// ---------------------------------------------------------------------------
export const getSellerOrders = async (sellerId, { page = 1, limit = 10, status }) => {
    const offset = (page - 1) * limit;

    const itemWhere = { seller_id: sellerId };
    const orderWhere = {};
    if (status) orderWhere.status = status;

    const { rows: orders, count: total } = await Order.findAndCountAll({
        include: [{
            model: OrderItem,
            as: 'items',
            where: itemWhere,
        }],
        where: orderWhere,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset,
        distinct: true,
    });

    return {
        data: orders,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
    };
};




