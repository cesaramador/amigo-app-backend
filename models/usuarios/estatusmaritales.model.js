// para generar los modelos se usa: npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string,password:string
import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }


const EstatusMaritales = sequelize.define('EstatusMaritales', {
    id_estatusmarital: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    estatus_marital: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    }
},
{
    timestamps: false,
    tableName: 'EstatusMaritales',
    indexes: [
        { name: 'Idx_EstatusMarital', fields: ['id_estatusmarital'] }
    ]
});

EstatusMaritales.associate = (models) => {
    EstatusMaritales.hasMany(models.Usuarios, { foreignKey: 'id_estatus_marital', sourceKey: 'id_estatusmarital' });
};

export default EstatusMaritales;





// CREATE TABLE EstatusMaritales
// (
// 	id_estatusmarital int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	estatus_marital varchar(20) NOT NULL UNIQUE -- casada/o, soltera/o, union libre
// );
