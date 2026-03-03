import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const ServiciosProveedores = sequelize.define('ServiciosProveedores', {
    id_servicioproveedor: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    servicio_proveedor: {
        type: DataTypes.STRING,
        length: 500,
        allowNull: false
    },
    id_tipo_servicio: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'ServiciosProveedores'
});

export default ServiciosProveedores;