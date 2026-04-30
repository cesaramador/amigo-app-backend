import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const EstatusEncuestasPreguntasRespuestas = sequelize.define('EstatusEncuestasPreguntasRespuestas', {
    id_estatusencpregresp: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    estatus_enc_preg_resp: {
        type: DataTypes.STRING(30),
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'EstatusEncuestasPreguntasRespuestas',
    indexes: [
        { name: 'Idx_EstatusEncuestaPreguntaRespuesta', fields: ['id_estatusencpregresp'] }
    ]
});

EstatusEncuestasPreguntasRespuestas.associate = (models) => {
    EstatusEncuestasPreguntasRespuestas.hasMany(models.Encuestas, {
        foreignKey: 'id_estatus_enc_preg_resp',
        sourceKey: 'id_estatusencpregresp'
    });
    EstatusEncuestasPreguntasRespuestas.hasMany(models.Preguntas, {
        foreignKey: 'id_estatus_enc_preg_resp',
        sourceKey: 'id_estatusencpregresp'
    });
    EstatusEncuestasPreguntasRespuestas.hasMany(models.Respuestas, {
        foreignKey: 'id_estatus_enc_preg_resp',
        sourceKey: 'id_estatusencpregresp'
    });
};

export default EstatusEncuestasPreguntasRespuestas;