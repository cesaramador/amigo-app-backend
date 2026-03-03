import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const UsuariosEncuestas = sequelize.define('UsuariosEncuestas', {
    id_usuario_encuesta: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_encuesta: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fecha_elaboracion_encuesta: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'UsuariosEncuestas'
});

export default UsuariosEncuestas;