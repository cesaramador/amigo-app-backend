import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const Encuestas = sequelize.define('Encuestas', {
    id_encuesta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    nombre_encuesta: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    id_tipo_encuesta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'TiposEncuestas',
            key: 'id_tipoencuesta'
        }
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
    tableName: 'Encuestas',
    indexes: [
        { name: 'Idx_Encuesta', fields: ['id_encuesta'] }
    ]
});

Encuestas.associate = (models) => {
    Encuestas.belongsTo(models.TiposEncuestas, {
        foreignKey: 'id_tipo_encuesta',
        targetKey: 'id_tipoencuesta'
    });
    Encuestas.belongsTo(models.EstatusEncuestasPreguntasRespuestas, {
        foreignKey: 'id_estatus_enc_preg_resp',
        targetKey: 'id_estatusencpregresp'
    });
    Encuestas.hasMany(models.EncuestasPreguntasRespuestas, {
        foreignKey: 'id_encuesta',
        sourceKey: 'id_encuesta'
    });
    Encuestas.hasMany(models.UsuariosEncuestas, {
        foreignKey: 'id_encuesta',
        sourceKey: 'id_encuesta'
    });
    Encuestas.hasMany(models.InterpretacionResultados, {
        foreignKey: 'id_encuesta',
        sourceKey: 'id_encuesta'
    });
};

export default Encuestas;