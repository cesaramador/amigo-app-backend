import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const TiposServiciosProveedores = sequelize.define('TiposServiciosProveedores', {
    id_tiposervicioproveedor: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    tipo_servicio_proveedor: {
        type: DataTypes.STRING(500),
        allowNull: true
    }
}, {
    timestamps: false,
    tableName: 'TiposServiciosProveedores',
    indexes: [
        { name: 'Idx_TipoServicioProveedor', fields: ['id_tiposervicioproveedor'] }
    ]
});

TiposServiciosProveedores.associate = (models) => {
    TiposServiciosProveedores.hasMany(models.ServiciosProveedores, {
        foreignKey: 'id_tipo_servicio',
        sourceKey: 'id_tiposervicioproveedor'
    });
};

export default TiposServiciosProveedores;