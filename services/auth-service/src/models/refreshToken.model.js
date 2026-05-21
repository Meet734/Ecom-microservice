import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.model.js';

const RefreshToken = sequelize.define('refresh_tokens', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
        model: 'users',
        key: 'id',
        },
        onDelete: 'CASCADE',
    },
    token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    device_info: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    ip_address: {
        type: DataTypes.STRING(45),  // IPv6 max length
        allowNull: true,
    },
    is_revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    indexes: [
        { fields: ['token_hash'] },
        { fields: ['user_id'] },
    ]
});

// Association
User.hasMany(RefreshToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

export default RefreshToken;