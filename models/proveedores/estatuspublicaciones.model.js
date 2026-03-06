import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const EstatusPublicaciones = sequelize.define('EstatusPublicaciones', {
    id_estatuspublicacion: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    estatus_publicacion: {
        type: DataTypes.STRING,
        length: 20,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'EstatusPublicaciones'
});

export default EstatusPublicaciones;