import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const TipoEncuestas = sequelize.define('TipoEncuestas', {
    id_tipoencuesta: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    tipo_encuesta: {
        type: DataTypes.STRING,
        length: 50,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'TipoEncuestas'
});

export default TipoEncuestas;
