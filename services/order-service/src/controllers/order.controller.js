import * as orderService from '../services/order.service.js';

export const createOrder = async (req, res, next) => {
    try {
        const order = await orderService.createOrder(
            req.user.userId,
            req.user.email,
            req.body
        );
        return res.status(201).json({ success: true, data: order });
    } catch (err) { next(err); }
};

export const confirmOrder = async (req, res, next) => {
    try {
        const order = await orderService.confirmOrder(req.params.orderId, req.user.userId);
        return res.status(200).json({ success: true, data: order });
    } catch (err) { next(err); }
};

export const getMyOrders = async (req, res, next) => {
    try {
        const { page, limit, status } = req.query;
        const result = await orderService.getUserOrders(req.user.userId, { page, limit, status });
        return res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
};

export const getOrderById = async (req, res, next) => {
    try {
        const order = await orderService.getOrderById(
            req.params.orderId,
            req.user.userId,
            req.user.role
        );
        return res.status(200).json({ success: true, data: order });
    } catch (err) { next(err); }
};

export const cancelOrder = async (req, res, next) => {
    try {
        const order = await orderService.cancelOrder(
            req.params.orderId,
            req.user.userId,
            req.user.role,
            req.body.reason
        );
        return res.status(200).json({ success: true, data: order });
    } catch (err) { next(err); }
};

// Admin-only controllers

export const getAllOrders = async (req, res, next) => {
    try {
        const { page, limit, status, user_id } = req.query;
        const result = await orderService.getAllOrders({ page, limit, status, user_id });
        return res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
};

export const updateOrderStatus = async (req, res, next) => {
    try {
        const order = await orderService.updateOrderStatus(req.params.orderId, req.body);
        return res.status(200).json({ success: true, data: order });
    } catch (err) { next(err); }
};

export const getSellerStats = async (req, res, next) => {
    try {
        const stats = await orderService.getSellerStats(req.user.userId);
        return res.status(200).json({ success: true, data: stats });
    } catch (err) { next(err); }
};

export const getSellerOrders = async (req, res, next) => {
    try {
        const { page, limit, status } = req.query;
        const result = await orderService.getSellerOrders(req.user.userId, { page, limit, status });
        return res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
};
