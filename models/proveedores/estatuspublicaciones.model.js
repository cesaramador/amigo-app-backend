import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const EstatusPublicaciones = sequelize.define('EstatusPublicaciones', {
    id_estatuspublicacion: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    estatus_publicacion: {
        type: DataTypes.STRING(20),
        allowNull: true
    }
}, {
    timestamps: false,
    tableName: 'EstatusPublicaciones',
    indexes: [
        { name: 'Idx_EstatusPublicacion', fields: ['id_estatuspublicacion'] }
    ]
});

EstatusPublicaciones.associate = (models) => {
    EstatusPublicaciones.hasMany(models.Publicaciones, {
        foreignKey: 'id_estatus_publicacion',
        sourceKey: 'id_estatuspublicacion'
    });
};

export default EstatusPublicaciones;