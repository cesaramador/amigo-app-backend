import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const EstatusEncuestasPreguntasRespuestas = sequelize.define('EstatusEncuestasPreguntasRespuestas', {
    id_estatusencpregresp: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    estatus_enc_preg_resp: {
        type: DataTypes.STRING,
        length: 30,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'EstatusEncuestasPreguntasRespuestas'
});

export default EstatusEncuestasPreguntasRespuestas;