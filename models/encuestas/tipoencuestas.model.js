import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const TiposEncuestas = sequelize.define('TiposEncuestas', {
    id_tipoencuesta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    tipo_encuesta: {
        type: DataTypes.STRING(50),
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'TiposEncuestas',
    indexes: [
        { name: 'Idx_TipoEncuesta', fields: ['id_tipoencuesta'] }
    ]
});

TiposEncuestas.associate = (models) => {
    TiposEncuestas.hasMany(models.Encuestas, {
        foreignKey: 'id_tipo_encuesta',
        sourceKey: 'id_tipoencuesta'
    });
};

export default TiposEncuestas;
