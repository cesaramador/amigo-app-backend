import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const EncuestasPreguntasRespuestas = sequelize.define('EncuestasPreguntasRespuestas', {
    id_encuesta_pregunta_respuesta: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    id_encuesta: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_pregunta: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_respuesta: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
}, {
    timestamps: false,
    tableName: 'EncuestasPreguntasRespuestas'
});

export default EncuestasPreguntasRespuestas;