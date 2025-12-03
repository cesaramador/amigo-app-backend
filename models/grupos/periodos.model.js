import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const Periodos = sequelize.define('Periodos', {
    id_periodo: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    periodo: {
        type: DataTypes.STRING,
        length: 100,
        allowNull: false
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: true
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: true
    }
},
{
    timestamps: false,
    tableName: 'Periodos'
});

export default Periodos;






// CREATE TABLE Periodos
// (
// 	id_periodo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	periodo varchar(100), -- nombre del período, ej (enero junio 2025)
//     fecha_inicio date,
//     fecha_fin date
// );