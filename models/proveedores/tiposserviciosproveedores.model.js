import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const TiposServiciosProveedores = sequelize.define('TiposServiciosProveedores', {
    id_tiposervicioproveedor: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    tipo_servicio_proveedor: {
        type: DataTypes.STRING,
        length: 500,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'TiposServiciosProveedores'
});

export default TiposServiciosProveedores;