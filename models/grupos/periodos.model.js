import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const Periodos = sequelize.define('Periodos', {
    id_periodo: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    periodo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
},
{
    timestamps: false,
    tableName: 'Periodos',
    indexes: [
        { name: 'Idx_Periodo', fields: ['id_periodo'] }
    ]
});

Periodos.associate = (models) => {
    Periodos.hasMany(models.PeriodosGrupos, { foreignKey: 'id_periodo', sourceKey: 'id_periodo' });
};

export default Periodos;






// CREATE TABLE Periodos
// (
// 	id_periodo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	periodo varchar(100), -- nombre del período, ej (enero junio 2025)
//     fecha_inicio date,
//     fecha_fin date
// );