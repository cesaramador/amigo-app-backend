import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const Asistencias = sequelize.define('Asistencias', {
    id_asistencia: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    id_inscripciongrupo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'InscripcionesGrupos',
            key: 'id_inscripciongrupo'
        }
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    asistencia: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    }
}, {
    timestamps: false,
    tableName: 'Asistencias'
});

Asistencias.associate = (models) => {
    Asistencias.belongsTo(models.InscripcionesGrupos, {
        foreignKey: 'id_inscripciongrupo',
        targetKey: 'id_inscripciongrupo'
    });
};

export default Asistencias;
