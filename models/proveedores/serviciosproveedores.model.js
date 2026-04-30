import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const ServiciosProveedores = sequelize.define('ServiciosProveedores', {
    id_servicioproveedor: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    servicio_proveedor: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    id_tipo_servicio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'TiposServiciosProveedores',
            key: 'id_tiposervicioproveedor'
        }
    }
}, {
    timestamps: false,
    tableName: 'ServiciosProveedores',
    indexes: [
        { name: 'Idx_ServicioProveedor', fields: ['id_servicioproveedor'] }
    ]
});

ServiciosProveedores.associate = (models) => {
    ServiciosProveedores.belongsTo(models.TiposServiciosProveedores, {
        foreignKey: 'id_tipo_servicio',
        targetKey: 'id_tiposervicioproveedor'
    });
    ServiciosProveedores.hasMany(models.ProveedoresConServicios, {
        foreignKey: 'id_servicio_proveedor',
        sourceKey: 'id_servicioproveedor'
    });
};

export default ServiciosProveedores;