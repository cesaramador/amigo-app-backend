import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const Grupos = sequelize.define('Grupos', {
    id_grupo: {
        type: DataTypes.INTEGER,
        AUTO_INCREMENT: true,
        primaryKey: true,
        allowNull: false
    },
    nombre_grupo: {
        type: DataTypes.STRING,
        length: 100,
        allowNull: false
    },
    id_tipogrupo: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
},
{
    timestamps: false,
    tableName: 'Grupos'
});

export default Grupos;








// CREATE TABLE Grupos
// (
// 	    id_grupo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	    nombre_grupo varchar(100) NOT NULL,
//      id_tipogrupo int ,
//      CONSTRAINT FK_Id_GrupoTipoGrupo FOREIGN KEY (id_tipogrupo) 
// 		    REFERENCES TiposGrupos (id_tipogrupo) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
// );