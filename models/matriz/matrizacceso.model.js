// para generar los modelos se usa: npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string,password:string
import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const MatrizAccesos = sequelize.define('MatrizAccesos', {
    id_matrizacceso: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    id_tipousuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_vista: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    estatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
},
{
    timestamps: false,
    tableName: 'MatrizAccesos'
});

export default MatrizAccesos;



// CREATE TABLE MatrizAccesos
// (
// 	id_matrizacceso int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	id_tipousuario int,
//     id_vista int,
//     estatus boolean, -- 0 sin acceso, 1 con acceso
// 	CONSTRAINT FK_Id_tipousuariomatriz FOREIGN KEY (id_tipousuario) 
// 		REFERENCES TiposUsuarios (id_tipousuario) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
// 	CONSTRAINT FK_Id_vista FOREIGN KEY (id_vista) 
// 		REFERENCES Vistas (id_vista) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
// );