import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const TiposGrupos = sequelize.define('TiposGrupos', {
    id_tipogrupo: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    tipo_grupo: {
        type: DataTypes.STRING,
        length: 30,
        allowNull: false,
        unique: true
    }
},
{
    timestamps: false,
    tableName: 'TiposGrupos'
});

export default TiposGrupos;





// CREATE TABLE TiposGrupos
// (
// 	id_tipogrupo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	tipo_grupo varchar(30) -- danza, manualidades, etc.
// );