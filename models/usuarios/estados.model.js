// para generar los modelos se usa: npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string,password:string
import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const Estados = sequelize.define('Estados', {
    id_estado: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    estado: {
        type: DataTypes.STRING,
        length: 100,
        allowNull: false,
        unique: true
    }
},
{
    timestamps: false,
    tableName: 'Estados'
});

export default Estados;





// CREATE TABLE Estados
// (
// 	id_estado int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	estado varchar(100) NOT NULL UNIQUE
// );