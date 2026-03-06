import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const TiposGrupos = sequelize.define('TiposGrupos', {
    id_tipogrupo: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    tipo_grupo: {
        type: DataTypes.STRING,
        length: 100,
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