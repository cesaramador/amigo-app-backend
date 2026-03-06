import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const InterpretacionResultados = sequelize.define('InterpretacionResultados', {
    id_interpreta_resultado: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    id_encuesta: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    puntuacion: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    gravedad: {
        type: DataTypes.STRING,
        length: 100,
        allowNull: false
    },
    acciones_propuestas: {
        type: DataTypes.STRING,
        length: 500,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'InterpretacionResultados'
});

export default InterpretacionResultados;