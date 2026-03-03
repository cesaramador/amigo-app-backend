import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const DetalleUsuariosEncuestas = sequelize.define('DetalleUsuariosEncuestas', {
    id_detalle_usuario_encuesta: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    id_usuario_encuesta: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_encuesta_pregunta_respuesta: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'DetalleUsuariosEncuestas'
});

export default DetalleUsuariosEncuestas;