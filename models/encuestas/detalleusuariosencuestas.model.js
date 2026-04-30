import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const DetalleUsuariosEncuestas = sequelize.define('DetalleUsuariosEncuestas', {
    id_detalle_usuario_encuesta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    id_usuario_encuesta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'UsuariosEncuestas',
            key: 'id_usuario_encuesta'
        }
    },
    id_encuesta_pregunta_respuesta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'EncuestasPreguntasRespuestas',
            key: 'id_encuesta_pregunta_respuesta'
        }
    }
}, {
    timestamps: false,
    tableName: 'DetalleUsuariosEncuestas',
    indexes: [
        {
            name: 'Idx_DetalleUsuarioEncuesta',
            fields: ['id_detalle_usuario_encuesta', 'id_usuario_encuesta', 'id_encuesta_pregunta_respuesta']
        }
    ]
});

DetalleUsuariosEncuestas.associate = (models) => {
    DetalleUsuariosEncuestas.belongsTo(models.UsuariosEncuestas, {
        foreignKey: 'id_usuario_encuesta',
        targetKey: 'id_usuario_encuesta'
    });
    DetalleUsuariosEncuestas.belongsTo(models.EncuestasPreguntasRespuestas, {
        foreignKey: 'id_encuesta_pregunta_respuesta',
        targetKey: 'id_encuesta_pregunta_respuesta'
    });
};

export default DetalleUsuariosEncuestas;