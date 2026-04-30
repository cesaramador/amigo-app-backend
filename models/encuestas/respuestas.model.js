import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const Respuestas = sequelize.define('Respuestas', {
    id_respuesta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    respuesta: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    valor: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_estatus_enc_preg_resp: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'EstatusEncuestasPreguntasRespuestas',
            key: 'id_estatusencpregresp'
        }
    }
}, {
    timestamps: false,
    tableName: 'Respuestas',
    indexes: [
        { name: 'Idx_Respuesta', fields: ['id_respuesta'] }
    ]
});

Respuestas.associate = (models) => {
    Respuestas.belongsTo(models.EstatusEncuestasPreguntasRespuestas, {
        foreignKey: 'id_estatus_enc_preg_resp',
        targetKey: 'id_estatusencpregresp'
    });
    Respuestas.hasMany(models.EncuestasPreguntasRespuestas, {
        foreignKey: 'id_respuesta',
        sourceKey: 'id_respuesta'
    });
};

export default Respuestas;