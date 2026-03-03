import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const Preguntas = sequelize.define('Preguntas', {
    id_pregunta: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    pregunta: {
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
    tableName: 'Preguntas'
});

export default Preguntas;