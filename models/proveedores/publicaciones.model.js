import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const Publicaciones = sequelize.define('Publicaciones', {
    id_publicacion: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    id_proveedorconservicio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    imagen: {
        type: DataTypes.STRING,
        length: 800,
        allowNull: false
    },
    fecha_registro_publicacion: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_inicio_publicacion: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_fin_publicacion: {
        type: DataTypes.DATE,
        allowNull: false
    },
    id_estatus_publicacion: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
}, {
    timestamps: false,
    tableName: 'Publicaciones'
});

export default Publicaciones;