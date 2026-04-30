import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const ProveedoresConServicios = sequelize.define('ProveedoresConServicios', {
    id_proveedorconservicio: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id_usuario'
        }
    },
    id_servicio_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'ServiciosProveedores',
            key: 'id_servicioproveedor'
        }
    }
}, {
    timestamps: false,
    tableName: 'ProveedoresConServicios',
    indexes: [
        { name: 'Idx_ProveedorConServicio', fields: ['id_proveedorconservicio'] }
    ]
});

ProveedoresConServicios.associate = (models) => {
    ProveedoresConServicios.belongsTo(models.Usuarios, {
        foreignKey: 'id_usuario',
        targetKey: 'id_usuario'
    });
    ProveedoresConServicios.belongsTo(models.ServiciosProveedores, {
        foreignKey: 'id_servicio_proveedor',
        targetKey: 'id_servicioproveedor'
    });
    ProveedoresConServicios.hasMany(models.Publicaciones, {
        foreignKey: 'id_proveedorconservicio',
        sourceKey: 'id_proveedorconservicio'
    });
};

export default ProveedoresConServicios;