import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const EncuestasPreguntasRespuestas = sequelize.define('EncuestasPreguntasRespuestas', {
    id_encuesta_pregunta_respuesta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    id_encuesta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Encuestas',
            key: 'id_encuesta'
        }
    },
    id_pregunta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Preguntas',
            key: 'id_pregunta'
        }
    },
    id_respuesta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Respuestas',
            key: 'id_respuesta'
        }
    },
}, {
    timestamps: false,
    tableName: 'EncuestasPreguntasRespuestas',
    indexes: [
        {
            name: 'Idx_EncuestaPreguntaRespuesta',
            fields: ['id_encuesta_pregunta_respuesta', 'id_encuesta', 'id_pregunta', 'id_respuesta']
        }
    ]
});

EncuestasPreguntasRespuestas.associate = (models) => {
    EncuestasPreguntasRespuestas.belongsTo(models.Encuestas, {
        foreignKey: 'id_encuesta',
        targetKey: 'id_encuesta'
    });
    EncuestasPreguntasRespuestas.belongsTo(models.Preguntas, {
        foreignKey: 'id_pregunta',
        targetKey: 'id_pregunta'
    });
    EncuestasPreguntasRespuestas.belongsTo(models.Respuestas, {
        foreignKey: 'id_respuesta',
        targetKey: 'id_respuesta'
    });
    EncuestasPreguntasRespuestas.hasMany(models.DetalleUsuariosEncuestas, {
        foreignKey: 'id_encuesta_pregunta_respuesta',
        sourceKey: 'id_encuesta_pregunta_respuesta'
    });
};

export default EncuestasPreguntasRespuestas;