// para generar los modelos se usa: npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string,password:string
import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const Municipios = sequelize.define('Municipios', {
    id_municipio: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    id_estado: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    num_municipio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    municipio: {
        type: DataTypes.STRING,
        length: 100,
        allowNull: false,
    }
},
{
    timestamps: false,
    tableName: 'Municipios'
});

export default Municipios;





// CREATE TABLE Municipios
// (
// 	id_municipio int AUTO_INCREMENT PRIMARY KEY NOT NULL,
//     id_estado int,
// 	num_municipio int,
// 	municipio varchar(100) NOT NULL,
//     CONSTRAINT FK_Id_MunicipioEstado FOREIGN KEY (id_estado) 
// 		REFERENCES Estados (id_estado) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
// );