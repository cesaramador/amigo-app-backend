import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const ProveedoresConServicios = sequelize.define('ProveedoresConServicios', {
    id_proveedorconservicio: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_servicio_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'ProveedoresConServicios'
});

export default ProveedoresConServicios;