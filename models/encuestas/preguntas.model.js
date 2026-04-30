import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const Preguntas = sequelize.define('Preguntas', {
    id_pregunta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    pregunta: {
        type: DataTypes.STRING(500),
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
    tableName: 'Preguntas',
    indexes: [
        { name: 'Idx_Pregunta', fields: ['id_pregunta'] }
    ]
});

Preguntas.associate = (models) => {
    Preguntas.belongsTo(models.EstatusEncuestasPreguntasRespuestas, {
        foreignKey: 'id_estatus_enc_preg_resp',
        targetKey: 'id_estatusencpregresp'
    });
    Preguntas.hasMany(models.EncuestasPreguntasRespuestas, {
        foreignKey: 'id_pregunta',
        sourceKey: 'id_pregunta'
    });
};

export default Preguntas;