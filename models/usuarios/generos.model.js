// para generar los modelos se usa: npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string,password:string
import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const Generos = sequelize.define('Generos', {
    id_genero: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    genero: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true
    }
},
{
    timestamps: false,
    tableName: 'Generos',
    indexes: [
        { name: 'Idx_Genero', fields: ['id_genero'] }
    ]
});

Generos.associate = (models) => {
    Generos.hasMany(models.Usuarios, { foreignKey: 'id_genero', sourceKey: 'id_genero' });
};

export default Generos;





// CREATE TABLE Generos
// (
// 	id_genero int AUTO_INCREMENT PRIMARY KEY NOT NULL,
// 	genero varchar(10)
// );