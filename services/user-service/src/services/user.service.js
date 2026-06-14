import { Op } from 'sequelize';
import Profile from '../models/profile.model.js';
import Address from '../models/address.model.js';
import sequelize from '../config/db.js';

export const getProfile = async (authUserId) => {
    const profile = await Profile.findOne({
        where: { auth_user_id: authUserId },
        include: [{ model: Address, as: 'addresses' }],
        order: [
            [{ model: Address, as: 'addresses' }, 'is_default', 'DESC']
        ],
    });

    if (!profile) {
        const err = new Error('Profile not found');
        err.statusCode = 404;
        throw err;
    }

    return profile;
};

export const updateProfile = async (authUserId, updates) => {
    const profile = await Profile.findOne({ where: { auth_user_id: authUserId } });

    if (!profile) {
        const err = new Error('Profile not found');
        err.statusCode = 404;
        throw err;
    }

    await profile.update(updates);
    return profile;
};

export const addAddress = async (authUserId, addressData) => {
    const profile = await Profile.findOne({ where: { auth_user_id: authUserId } });
    if (!profile) {
        const err = new Error('Profile not found');
        err.statusCode = 404;
        throw err;
    }

    return await sequelize.transaction(async (t) => {
        if (addressData.is_default) {
            await Address.update(
                { is_default: false },
                { where: { profile_id: profile.id }, transaction: t }
            );
        }

        const address = await Address.create(
            { ...addressData, profile_id: profile.id },
            { transaction: t }
        );

        return address;
    });
};

export const getAddresses = async (authUserId) => {
    const profile = await Profile.findOne({ where: { auth_user_id: authUserId } });
    if (!profile) {
        const err = new Error('Profile not found');
        err.statusCode = 404;
        throw err;
    }

    return await Address.findAll({
        where: { profile_id: profile.id },
        order: [['is_default', 'DESC'], ['created_at', 'ASC']],
    });
};

export const updateAddress = async (authUserId, addressId, updates) => {
    const profile = await Profile.findOne({ where: { auth_user_id: authUserId } });
    if (!profile) {
        const err = new Error('Profile not found');
        err.statusCode = 404;
        throw err;
    }

    const address = await Address.findOne({
        where: { id: addressId, profile_id: profile.id },
    });

    if (!address) {
        const err = new Error('Address not found');
        err.statusCode = 404;
        throw err;
    }

    return await sequelize.transaction(async (t) => {
        if (updates.is_default === true) {
            await Address.update(
                { is_default: false },
                { where: { profile_id: profile.id, id: { [Op.ne]: addressId } }, transaction: t }
            );
        }
        await address.update(updates, { transaction: t });
        return address;
    });
};

export const deleteAddress = async (authUserId, addressId) => {
    const profile = await Profile.findOne({ where: { auth_user_id: authUserId } });
    if (!profile) {
        const err = new Error('Profile not found');
        err.statusCode = 404;
        throw err;
    }

    const address = await Address.findOne({
        where: { id: addressId, profile_id: profile.id },
    });

    if (!address) {
        const err = new Error('Address not found');
        err.statusCode = 404;
        throw err;
    }

    await address.destroy();
    return { message: 'Address deleted' };
};

export const getAddressById = async (addressId) => {
    const address = await Address.findByPk(addressId, {
        include: [{ model: Profile, as: 'profile', attributes: ['auth_user_id'] }],
    });

    if (!address) {
        const err = new Error('Address not found');
        err.statusCode = 404;
        throw err;
    }

    return address;
};