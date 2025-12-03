// para generar los modelos se usa: npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string,password:string
import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const Vistas = sequelize.define('Vistas', {
    id_vista: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    vista: {
        type: DataTypes.STRING,
        length: 20,
        allowNull: false
    }
},
{
    timestamps: false,
    tableName: 'Vistas'
});

export default Vistas;



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