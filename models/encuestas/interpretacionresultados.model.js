import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const InterpretacionResultados = sequelize.define('InterpretacionResultados', {
    id_interpreta_resultado: {
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
    puntuacion: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    gravedad: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    acciones_propuestas: {
        type: DataTypes.STRING(500),
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'InterpretacionResultados',
    indexes: [
        { name: 'Idx_InterpretaResultado', fields: ['id_interpreta_resultado', 'id_encuesta'] }
    ]
});

InterpretacionResultados.associate = (models) => {
    InterpretacionResultados.belongsTo(models.Encuestas, {
        foreignKey: 'id_encuesta',
        targetKey: 'id_encuesta'
    });
};

export default InterpretacionResultados;