import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const EstatusGrupos = sequelize.define('EstatusGrupos', {
    id_estatusgrupo: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    estatus_grupo: {
        type: DataTypes.STRING,
        length: 20,
        allowNull: false,
        unique: true
    }
},
{
    timestamps: false,
    tableName: 'EstatusGrupos'
});

export default EstatusGrupos;





// CREATE TABLE EstatusGrupos
// (
// 	id_estatusgrupo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	estatus_grupo varchar(20) -- vigente, suspendido, cancelado, etc.
// );
