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
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    }
},
{
    timestamps: false,
    tableName: 'Estados',
    indexes: [
        { name: 'Idx_Estado', fields: ['id_estado'] }
    ]
});

Estados.associate = (models) => {
    Estados.hasMany(models.Usuarios, { foreignKey: 'id_estado', sourceKey: 'id_estado' });
    Estados.hasMany(models.Municipios, { foreignKey: 'id_estado', sourceKey: 'id_estado' });
};

export default Estados;





// CREATE TABLE Estados
// (
// 	id_estado int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	estado varchar(100) NOT NULL UNIQUE
// );