import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Profile from './profile.model.js';

const Address = sequelize.define('addresses', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    profile_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'profiles', key: 'id' },
        onDelete: 'CASCADE',
    },
    label: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Home',
    },
    full_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    line1: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    line2: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    state: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    pincode: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    country: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'India',
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    indexes: [
        { fields: ['profile_id'] },
    ],
});

Profile.hasMany(Address, { foreignKey: 'profile_id', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(Profile, { foreignKey: 'profile_id', as: 'profile' });

export default Address;