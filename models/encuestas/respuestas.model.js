import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const Respuestas = sequelize.define('Respuestas', {
    id_respuesta: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    respuesta: {
        type: DataTypes.STRING,
        length: 500,
        allowNull: false
    },
    id_estatus_enc_preg_resp: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'Respuestas'
});

export default Respuestas;