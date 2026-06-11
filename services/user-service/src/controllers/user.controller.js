import * as userService from '../services/user.service.js';

export const getMyProfile = async (req, res, next) => {
    try {
        const profile = await userService.getProfile(req.user.userId);
        return res.status(200).json({ success: true, data: profile });
    } catch (err) { next(err); }
};

export const updateMyProfile = async (req, res, next) => {
    try {
        const profile = await userService.updateProfile(req.user.userId, req.body);
        return res.status(200).json({ success: true, data: profile });
    } catch (err) { next(err); }
};

export const getMyAddresses = async (req, res, next) => {
    try {
        const addresses = await userService.getAddresses(req.user.userId);
        return res.status(200).json({ success: true, data: addresses });
    } catch (err) { next(err); }
};

export const addAddress = async (req, res, next) => {
    try {
        const address = await userService.addAddress(req.user.userId, req.body);
        return res.status(201).json({ success: true, data: address });
    } catch (err) { next(err); }
};

export const updateAddress = async (req, res, next) => {
    try {
        const address = await userService.updateAddress(req.user.userId, req.params.addressId, req.body);
        return res.status(200).json({ success: true, data: address });
    } catch (err) { next(err); }
};

export const deleteAddress = async (req, res, next) => {
    try {
        const result = await userService.deleteAddress(req.user.userId, req.params.addressId);
        return res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
};

export const getAddressInternal = async (req, res, next) => {
    try {
        const address = await userService.getAddressById(req.params.addressId);
        return res.status(200).json({ success: true, data: address });
    } catch (err) { next(err); }
};