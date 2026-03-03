import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const Encuestas = sequelize.define('Encuestas', {
    id_encuesta: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    nombre_encuesta: {
        type: DataTypes.STRING,
        length: 500,
        allowNull: false
    },
    id_tipo_encuesta: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_estatus_enc_preg_resp: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'Encuestas'
});

export default Encuestas;