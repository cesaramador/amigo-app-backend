// para generar los modelos se usa: npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string,password:string
import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }

const CategoriasViviendas = sequelize.define('CategoriasViviendas', {
    id_categoriavivienda: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    categoria_vivienda: {
        type: DataTypes.STRING,
        length: 20,
        allowNull: false,
        unique: true
    }
},
{
    timestamps: false,
    tableName: 'CategoriasViviendas'
});

export default CategoriasViviendas;
