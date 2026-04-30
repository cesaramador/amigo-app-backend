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
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    }
},
{
    timestamps: false,
    tableName: 'CategoriasViviendas',
    indexes: [
        { name: 'Idx_CategoriaVivienda', fields: ['id_categoriavivienda'] }
    ]
});

CategoriasViviendas.associate = (models) => {
    CategoriasViviendas.hasMany(models.Usuarios, { foreignKey: 'id_categoria_vivienda', sourceKey: 'id_categoriavivienda' });
};

export default CategoriasViviendas;
