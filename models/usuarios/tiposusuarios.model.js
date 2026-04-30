// para generar los modelos se usa: npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string,password:string
import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/mysql.js';  // Importante: importar { sequelize }


const TiposUsuarios = sequelize.define('TiposUsuarios', {
    id_tipousuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    tipo_usuario: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    }
},
{
    timestamps: false,
    tableName: 'TiposUsuarios',
    indexes: [
        { name: 'Idx_TipoUsuario', fields: ['id_tipousuario'] }
    ]
});

TiposUsuarios.associate = (models) => {
    TiposUsuarios.hasMany(models.Usuarios, { foreignKey: 'id_tipousuario', sourceKey: 'id_tipousuario' });
};

export default TiposUsuarios;

