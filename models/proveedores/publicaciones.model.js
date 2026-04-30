import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const Publicaciones = sequelize.define('Publicaciones', {
    id_publicacion: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    id_proveedorconservicio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'ProveedoresConServicios',
            key: 'id_proveedorconservicio'
        }
    },
    imagen: {
        type: DataTypes.STRING(800),
        allowNull: false
    },
    fecha_registro_publicacion: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    fecha_inicio_publicacion: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    fecha_fin_publicacion: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    id_estatus_publicacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'EstatusPublicaciones',
            key: 'id_estatuspublicacion'
        }
    },
}, {
    timestamps: false,
    tableName: 'Publicaciones',
    indexes: [
        { name: 'Idx_Publicacion', fields: ['id_publicacion', 'id_proveedorconservicio'] }
    ]
});

Publicaciones.associate = (models) => {
    Publicaciones.belongsTo(models.ProveedoresConServicios, {
        foreignKey: 'id_proveedorconservicio',
        targetKey: 'id_proveedorconservicio'
    });
    Publicaciones.belongsTo(models.EstatusPublicaciones, {
        foreignKey: 'id_estatus_publicacion',
        targetKey: 'id_estatuspublicacion'
    });
};

export default Publicaciones;