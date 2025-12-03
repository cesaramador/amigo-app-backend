// para generar los modelos se usa: npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string,password:string
import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }


const EstatusUsuarios = sequelize.define('EstatusUsuarios', {
    id_estatususuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    estatus_usuario: {
        type: DataTypes.STRING,
        length: 20,
        allowNull: false,
        unique: true
    }
},
{
    timestamps: false,
    tableName: 'EstatusUsuarios'
});

export default EstatusUsuarios;






// CREATE TABLE EstatusUsuarios
// (
// 	id_estatususuario int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	estatus_usuario varchar(20) NOT NULL UNIQUE -- vigente, suspendido, cancelado, etc.
// );