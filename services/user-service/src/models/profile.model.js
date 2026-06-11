import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Profile = sequelize.define('profiles', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    auth_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    first_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    last_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    avatar_url: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    indexes: [
        { fields: ['auth_user_id'] },
    ],
});

export default Profile;