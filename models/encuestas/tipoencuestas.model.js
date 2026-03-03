import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

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
